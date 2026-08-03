'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2, Key, RefreshCw, Copy, Check } from 'lucide-react';

export default function ApiSettingsPage() {
    const [apiSecret, setApiSecret] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [generating, setGenerating] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'curl' | 'node' | 'php' | 'python'>('curl');

    useEffect(() => {
        fetchApiSecret();
    }, []);

    const fetchApiSecret = async () => {
        try {
            const res = await fetch('/api/admin/settings/api');
            const data = await res.json();
            if (data.success) {
                setApiSecret(data.apiSecret || '');
            } else {
                toast.error(data.message || 'Failed to fetch API Secret');
            }
        } catch (error) {
            console.error(error);
            toast.error('An error occurred while fetching API Secret');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (apiSecret && !window.confirm('Are you sure you want to regenerate the API Secret? Any existing integrations using the current secret will stop working.')) {
            return;
        }

        setGenerating(true);
        try {
            const res = await fetch('/api/admin/settings/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'generate' })
            });
            const data = await res.json();
            if (data.success) {
                setApiSecret(data.apiSecret);
                toast.success('API Secret generated successfully');
            } else {
                toast.error(data.message || 'Failed to generate API Secret');
            }
        } catch (error) {
            console.error(error);
            toast.error('An error occurred while generating API Secret');
        } finally {
            setGenerating(false);
        }
    };

    const handleCopy = () => {
        if (!apiSecret) return;
        navigator.clipboard.writeText(apiSecret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Copied to clipboard');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin h-12 w-12 text-gray-900" />
            </div>
        );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com';

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">API Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your API secret and view API documentation.</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <Key className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">API Secret Key</h2>
                </div>

                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Use this secret key to authenticate your requests to the API. Keep this secret safe and do not share it publicly.
                    </p>
                    
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                readOnly
                                value={apiSecret || 'No secret generated yet'}
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 font-mono focus:outline-none"
                            />
                            {apiSecret && (
                                <button
                                    onClick={handleCopy}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Copy to clipboard"
                                >
                                    {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                                </button>
                            )}
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="bg-gray-900 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50 min-w-[140px] justify-center"
                        >
                            {generating ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4" />
                                    {apiSecret ? 'Regenerate' : 'Generate'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Documentation: Fetch Orders</h2>
                    <p className="text-sm text-gray-500 mt-1">Learn how to fetch all orders using the API.</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <h3 className="text-md font-medium text-gray-900 mb-2">Endpoint</h3>
                        <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase">GET</span>
                            <code className="text-sm text-gray-800 font-mono">{baseUrl}/api/v1/orders</code>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-md font-medium text-gray-900 mb-2">Headers</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    <tr>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">x-api-secret</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Your generated API secret</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Yes</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-md font-medium text-gray-900">Code Examples</h3>
                            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                                {['curl', 'node', 'php', 'python'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                            activeTab === tab
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        {tab === 'curl' ? 'cURL' : tab === 'node' ? 'Node.js' : tab === 'php' ? 'PHP' : 'Python'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="bg-gray-900 rounded-lg p-4 relative group">
                            {activeTab === 'curl' && (
                                <pre className="text-gray-100 text-sm font-mono overflow-x-auto">
{`curl -X GET ${baseUrl}/api/v1/orders \\
  -H "x-api-secret: ${apiSecret || 'your_api_secret_here'}"`}
                                </pre>
                            )}

                            {activeTab === 'node' && (
                                <pre className="text-gray-100 text-sm font-mono overflow-x-auto">
{`fetch('${baseUrl}/api/v1/orders', {
  headers: {
    'x-api-secret': '${apiSecret || 'your_api_secret_here'}'
  }
})
.then(response => response.json())
.then(data => console.log(data));`}
                                </pre>
                            )}

                            {activeTab === 'php' && (
                                <pre className="text-gray-100 text-sm font-mono overflow-x-auto">
{`$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, '${baseUrl}/api/v1/orders');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'x-api-secret: ${apiSecret || 'your_api_secret_here'}'
]);
$response = curl_exec($ch);
curl_close($ch);
echo $response;`}
                                </pre>
                            )}

                            {activeTab === 'python' && (
                                <pre className="text-gray-100 text-sm font-mono overflow-x-auto">
{`import requests

url = '${baseUrl}/api/v1/orders'
headers = {
    'x-api-secret': '${apiSecret || 'your_api_secret_here'}'
}

response = requests.get(url, headers=headers)
print(response.json())`}
                                </pre>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Documentation: Fetch Products</h2>
                    <p className="text-sm text-gray-500 mt-1">Learn how to fetch all products using the API. The response includes populated fields for category, subCategory, childCategory, subChildCategory, and brand.</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <h3 className="text-md font-medium text-gray-900 mb-2">Endpoint</h3>
                        <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase">GET</span>
                            <code className="text-sm text-gray-800 font-mono">{baseUrl}/api/v1/products</code>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-md font-medium text-gray-900 mb-2">Headers</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    <tr>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">x-api-secret</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Your generated API secret</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Yes</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-md font-medium text-gray-900 mb-2">Response Example</h3>
                        <div className="bg-gray-900 rounded-lg p-4 relative group">
                            <pre className="text-gray-100 text-sm font-mono overflow-x-auto">
{`{
  "success": true,
  "count": 100,
  "products": [
    {
      "_id": "60d5ecb8b392d7...d4",
      "title": "Smartphone Pro Max",
      "slug": "smartphone-pro-max",
      "price": 999,
      "mrp": 1099,
      "stock": 50,
      "category": {
        "_id": "60d5ec49b392d7...d3",
        "name": "Electronics",
        "slug": "electronics",
        "icon": "icon-url.png"
      },
      "brand": {
        "_id": "60d5ec49b392d7...d1",
        "name": "TechCorp",
        "slug": "techcorp",
        "logo": "logo-url.png"
      },
      "variants": [
        {
           "attributes": { "color": "Black", "storage": "256GB" },
           "price": 999,
           "stock": 25
        }
      ],
      "images": ["url1.jpg", "url2.jpg"]
      // ...other product fields
    }
  ]
}`}
                            </pre>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-md font-medium text-gray-900">Code Examples</h3>
                            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                                {['curl', 'node', 'php', 'python'].map((tab) => (
                                    <button
                                        key={tab + '-prod'}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                            activeTab === tab
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        {tab === 'curl' ? 'cURL' : tab === 'node' ? 'Node.js' : tab === 'php' ? 'PHP' : 'Python'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="bg-gray-900 rounded-lg p-4 relative group">
                            {activeTab === 'curl' && (
                                <pre className="text-gray-100 text-sm font-mono overflow-x-auto">
{`curl -X GET ${baseUrl}/api/v1/products \\
  -H "x-api-secret: ${apiSecret || 'your_api_secret_here'}"`}
                                </pre>
                            )}

                            {activeTab === 'node' && (
                                <pre className="text-gray-100 text-sm font-mono overflow-x-auto">
{`fetch('${baseUrl}/api/v1/products', {
  headers: {
    'x-api-secret': '${apiSecret || 'your_api_secret_here'}'
  }
})
.then(response => response.json())
.then(data => console.log(data));`}
                                </pre>
                            )}

                            {activeTab === 'php' && (
                                <pre className="text-gray-100 text-sm font-mono overflow-x-auto">
{`$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, '${baseUrl}/api/v1/products');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'x-api-secret: ${apiSecret || 'your_api_secret_here'}'
]);
$response = curl_exec($ch);
curl_close($ch);
echo $response;`}
                                </pre>
                            )}

                            {activeTab === 'python' && (
                                <pre className="text-gray-100 text-sm font-mono overflow-x-auto">
{`import requests

url = '${baseUrl}/api/v1/products'
headers = {
    'x-api-secret': '${apiSecret || 'your_api_secret_here'}'
}

response = requests.get(url, headers=headers)
print(response.json())`}
                                </pre>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
