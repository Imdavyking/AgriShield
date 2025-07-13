export default function HomePage() {
  return (
    <div className="min-h-screen bg-green-50 text-gray-800 font-sans">
      {/* Hero Section */}
      <section className="bg-green-100 py-20 text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold mb-4">
            Protect Your Farm Against Unpredictable Weather
          </h2>
          <p className="text-lg mb-6 max-w-xl mx-auto">
            AgriShield offers weather-indexed insurance tailored for farmers.
            Stay covered against drought, floods, and other climate risks.
          </p>
          <a
            href="#get-started"
            className="bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-700 transition"
          >
            Get Started
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="container mx-auto px-6 grid md:grid-cols-3 gap-10 text-center">
          <div>
            <h3 className="text-xl font-semibold mb-2">Affordable Plans</h3>
            <p>Flexible premium options for all farm sizes and budgets.</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Instant Payouts</h3>
            <p>Automated payouts based on weather data—no claims needed.</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Data-Driven</h3>
            <p>Powered by satellite and IoT weather monitoring technology.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-green-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-8">How It Works</h2>
          <ol className="space-y-4 max-w-2xl mx-auto text-left list-decimal list-inside">
            <li>Register and input your farm location and crop details.</li>
            <li>Select your coverage type (e.g., drought, excess rain).</li>
            <li>
              AgriShield monitors weather conditions using satellite data.
            </li>
            <li>
              Automatic payout is triggered if adverse weather is detected.
            </li>
          </ol>
        </div>
      </section>

      {/* Call to Action */}
      <section
        id="get-started"
        className="py-16 bg-green-600 text-white text-center"
      >
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4">
            Start Protecting Your Farm Today
          </h2>
          <a
            href="#contact"
            className="inline-block bg-white text-green-600 px-6 py-3 rounded-full font-semibold hover:bg-green-100 transition"
          >
            Contact Us
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-green-700 text-white py-6 text-center">
        <p>
          Contact us at{" "}
          <a href="mailto:support@agrishield.com" className="underline">
            support@agrishield.com
          </a>
        </p>
        <p className="mt-2 text-sm">
          &copy; {new Date().getFullYear()} AgriShield. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
