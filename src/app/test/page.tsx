export default function TestPage() {
  return (
    <div className="min-h-screen bg-blue-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">Test Page</h1>
      <p className="text-lg mb-6">This is a test page to check if Tailwind CSS is working.</p>
      <div className="flex gap-4">
        <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
          Primary Button
        </button>
        <button className="border-2 border-white text-white font-bold py-2 px-4 rounded">
          Outline Button
        </button>
      </div>
      <div className="mt-8 p-6 bg-blue-800 rounded-lg border border-white/10 max-w-md">
        <h2 className="text-2xl font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
          Card Title
        </h2>
        <p className="text-gray-300">This is a test card with a gradient text title.</p>
      </div>
    </div>
  );
}
