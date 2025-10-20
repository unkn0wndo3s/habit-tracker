import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TrackIt - SSG Demo',
  description: 'A Next.js application with Static Site Generation',
};

// Simulated data that would typically come from an API or CMS
const getStaticData = async () => {
  // In a real app, this would be an API call or database query
  return {
    title: 'Welcome to TrackIt',
    description: 'This page was generated at build time using Next.js SSG',
    features: [
      'Static Site Generation (SSG)',
      'TypeScript Support',
      'Tailwind CSS',
      'shadcn/ui Components',
      'SEO Optimized'
    ],
    buildTime: new Date().toISOString()
  };
};

export default async function Home() {
  const data = await getStaticData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {data.title}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              {data.description}
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
              ✅ SSG Mode Active
            </div>
          </header>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {data.features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
                    {feature}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  This feature is pre-rendered at build time for optimal performance.
                </p>
              </div>
            ))}
          </div>

          {/* Build Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Build Information
            </h2>
            <div className="space-y-2">
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-semibold">Build Time:</span> {data.buildTime}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-semibold">Rendering Mode:</span> Static Site Generation (SSG)
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-semibold">Framework:</span> Next.js 15 with App Router
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Ready to get started?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              This project is configured with TypeScript, Tailwind CSS, and shadcn/ui components.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-300">
                Start Building
              </button>
              <button className="px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold rounded-lg transition-colors duration-300">
                View Documentation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
