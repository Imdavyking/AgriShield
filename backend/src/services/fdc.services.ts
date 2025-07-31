import { environment } from "../utils/config";

const {
  JQ_VERIFIER_URL_TESTNET,
  JQ_VERIFIER_API_KEY_TESTNET,
  FDC_VERIFIER_URL_TESTNET,
  FDC_VERIFIER_API_KEY_TESTNET,
} = environment;

class Base {
  toHex(data: string) {
    var result = "";
    for (var i = 0; i < data.length; i++) {
      result += data.charCodeAt(i).toString(16);
    }

    return result.padEnd(64, "0");
  }

  toUtf8HexString(data: string) {
    return "0x" + this.toHex(data);
  }

  sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async prepareAttestationRequestBase(
    url: string,
    apiKey: string,
    attestationTypeBase: string,
    sourceIdBase: string,
    requestBody: any
  ) {
    console.log("Url:", url, "\n");
    const attestationType = this.toUtf8HexString(attestationTypeBase);
    const sourceId = this.toUtf8HexString(sourceIdBase);

    const request = {
      attestationType: attestationType,
      sourceId: sourceId,
      requestBody: requestBody,
    };
    console.log("Prepared request:\n", request, "\n");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    if (response.status != 200) {
      throw new Error(
        `Response status is not OK, status ${response.status} ${response.statusText}\n`
      );
    }
    console.log("Response status is OK\n");

    return await response.json();
  }
}

const base = new Base();

async function prepareAttestationRequestEVMTransaction(
  transactionHash: string
) {
  const requiredConfirmations = "1";
  const provideInput = true;
  const listEvents = true;
  const logIndices: string[] = [];
  const attestationTypeBase = "EVMTransaction";
  const sourceIdBase = "testETH";
  const urlTypeBase = "eth";

  const requestBody = {
    transactionHash: transactionHash,
    requiredConfirmations: requiredConfirmations,
    provideInput: provideInput,
    listEvents: listEvents,
    logIndices: logIndices,
  };

  const verifierUrlBase = FDC_VERIFIER_URL_TESTNET;

  const url = `${verifierUrlBase}verifier/${urlTypeBase}/EVMTransaction/prepareRequest`;
  const apiKey = FDC_VERIFIER_API_KEY_TESTNET!;

  return await base.prepareAttestationRequestBase(
    url,
    apiKey,
    attestationTypeBase,
    sourceIdBase,
    requestBody
  );
}

async function prepareAttestationRequestJson(
  apiUrl: string,
  postprocessJq: string,
  abiSignature: string
): Promise<{
  abiEncodedRequest: string;
}> {
  // Configuration constants
  const attestationTypeBase = "IJsonApi";
  const sourceIdBase = "WEB2";
  const requestBody = {
    url: apiUrl,
    postprocessJq: postprocessJq,
    abi_signature: abiSignature,
  };
  const verifierUrlBase = JQ_VERIFIER_URL_TESTNET;
  const url = `${verifierUrlBase}JsonApi/prepareRequest`;
  const apiKey = JQ_VERIFIER_API_KEY_TESTNET!;

  return await base.prepareAttestationRequestBase(
    url,
    apiKey,
    attestationTypeBase,
    sourceIdBase,
    requestBody
  );
}

export async function getEVMTransactionAttestation(transactionHash: string) {
  const data = await prepareAttestationRequestEVMTransaction(transactionHash);
  console.log("Data from prepareAttestationEVMRequest:\n", data, "\n");
  return data;
}

export async function getJsonAttestation(baseUrl: string) {
  const apiUrl = baseUrl;

  console.log("API URL:", apiUrl, "\n");

  const postprocessJq = `{
  time: .current_weather.time,
  interval: (.current_weather.interval // 0 | floor),
  temperature: (.current_weather.temperature // 0 | floor),
  windspeed: (.current_weather.windspeed // 0 | floor),
  winddirection: (.current_weather.winddirection // 0 | floor),
  isDay: (.current_weather.is_day // 0 | floor),
  weathercode: (.current_weather.weathercode // 0 | floor)
}`;

  const abiSignature = `{
  "components": [
    {
      "internalType": "string",
      "name": "time",
      "type": "string"
    },
    {
      "internalType": "uint256",
      "name": "interval",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "temperature",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "windspeed",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "winddirection",
      "type": "uint256"
    },
    {
      "internalType": "uint8",
      "name": "isDay",
      "type": "uint8"
    },
    {
      "internalType": "uint256",
      "name": "weathercode",
      "type": "uint256"
    }
  ],
  "internalType": "struct Weather.CurrentWeather",
  "name": "weather",
  "type": "tuple"
}`;

  const data = await prepareAttestationRequestJson(
    apiUrl,
    postprocessJq,
    abiSignature
  );
  console.log("Data from prepareAttestationJSONRequest:\n", data, "\n");
  return data;
}
