let lat = args[0];
let long = args[1];

if (!lat || !long) {
  console.log("Lat or Long is missing,using defaults");
  lat = "22.30";
  long = "144.17";
}

const apiResponse = await Functions.makeHttpRequest({
  url: `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&current=temperature_2m`,
});

if (apiResponse.error) {
  console.log("Error in api call");
  throw new Error("Request failed");
}

let temperature = apiResponse.data.current.temperature_2m;

console.log(temperature);

return Functions.encodeUint256(Math.round(temperature));


// are the owner of the subscription.

// Wallet address:
// 0x673d2d7af5ccd60ba0d72ca222fae71ee51d981f
// Subscription id:
// 5131
// Router address:
// 0xb83E47C2bC239B3bf370bc41e1459A34b41238D0