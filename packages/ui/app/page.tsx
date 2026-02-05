import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to NHS Notify Supplier Configuration
          </h2>
          <p className="text-gray-700 text-lg mb-6">
            Manage and configure supplier specifications, pack configurations, and delivery options
            for the NHS Notify service.
          </p>
        </section>

        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Pack Specifications
            </h3>
            <p className="text-gray-600 mb-4">
              Define and manage pack specifications including postage, paper types, and assembly options.
            </p>
            <a href="/pack-specifications" className="text-[#005EB8] font-medium hover:underline">
              View specifications →
            </a>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Supplier Reports
            </h3>
            <p className="text-gray-600 mb-4">
              View interactive pack specification reports per supplier with status tracking.
            </p>
            <a href="/supplier-reports" className="text-[#005EB8] font-medium hover:underline">
              View reports →
            </a>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Reference Data
            </h3>
            <p className="text-gray-600 mb-4">
              Configure envelopes, papers, postage tariffs, and inserts that are used in pack specifications.
            </p>
            <a href="/config" className="text-[#005EB8] font-medium hover:underline">
              Manage config →
            </a>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Documentation
            </h3>
            <p className="text-gray-600 mb-4">
              Access technical documentation and API specifications for the configuration system.
            </p>
            <a href="/docs" className="text-[#005EB8] font-medium hover:underline">
              View docs →
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
