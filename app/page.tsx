'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ApiKey {
  id: string;
  name: string;
  key_hash: string;
  provider: 'claude' | 'openai';
  created_at: number;
  last_used_at: number | null;
  usage_count: number;
}

interface NewKey extends ApiKey {
  key: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyProvider, setNewKeyProvider] = useState<'claude' | 'openai'>('claude');
  const [createdKey, setCreatedKey] = useState<NewKey | null>(null);
  const [baseUrl, setBaseUrl] = useState('http://localhost:3000');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchKeys();
      // Set the base URL after component mounts (client-side only)
      setBaseUrl(window.location.origin);
    }
  }, [status, router]);

  const fetchKeys = async () => {
    try {
      const response = await fetch('/api/keys');
      const data = await response.json();
      setKeys(data.keys || []);
    } catch (error) {
      console.error('Error fetching keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      alert('Please enter a name for the key');
      return;
    }

    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName, provider: newKeyProvider }),
      });

      const data = await response.json();
      if (data.success && data.key) {
        setCreatedKey(data.key);
        setNewKeyName('');
        fetchKeys();
      } else {
        const errorMsg = data.details
          ? `${data.error}: ${data.details}`
          : data.error || 'Unknown error';
        alert('Failed to create key: ' + errorMsg);
        console.error('API Error:', data);
      }
    } catch (error) {
      console.error('Error creating key:', error);
      alert('Failed to create key');
    }
  };

  const handleDeleteKey = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the key "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/keys/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        fetchKeys();
      } else {
        alert('Failed to delete key: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting key:', error);
      alert('Failed to delete key');
    }
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <header className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Ollama API Key Manager
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your Claude and OpenAI API keys with Ollama-compatible interface
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Sign Out
          </button>
        </header>

        <div className="mb-8">
          <button
            onClick={() => {
              setShowCreateModal(true);
              setCreatedKey(null);
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create New API Key
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        ) : keys.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No API keys yet. Create one to get started!
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Usage Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Last Used
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {keys.map((key) => (
                    <tr key={key.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {key.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {key.key_hash.substring(0, 16)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            key.provider === 'claude'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}
                        >
                          {key.provider}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {key.usage_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(key.last_used_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(key.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteKey(key.id, key.name)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              {!createdKey ? (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Create New API Key
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Key Name
                      </label>
                      <input
                        type="text"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g., My Claude Key"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Provider
                      </label>
                      <select
                        value={newKeyProvider}
                        onChange={(e) => setNewKeyProvider(e.target.value as 'claude' | 'openai')}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="claude">Claude</option>
                        <option value="openai">OpenAI</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={handleCreateKey}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">
                    API Key Created!
                  </h2>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                      Save this key now! It will not be shown again.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Name
                      </label>
                      <p className="text-gray-900 dark:text-white font-medium">{createdKey.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Provider
                      </label>
                      <p className="text-gray-900 dark:text-white font-medium capitalize">
                        {createdKey.provider}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        API Key
                      </label>
                      <div className="flex gap-2">
                        <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded font-mono text-sm break-all">
                          {createdKey.key}
                        </code>
                        <button
                          onClick={() => copyToClipboard(createdKey.key)}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        setCreatedKey(null);
                      }}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Usage Info */}
        <div className="mt-12 space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              How to Use
            </h3>
            <div className="space-y-4 text-sm text-blue-800 dark:text-blue-200">
              <div>
                <p className="mb-2">
                  <strong>Base URL:</strong>{' '}
                  <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                    {baseUrl}/api/proxy
                  </code>
                </p>
                <p className="text-xs">
                  This proxy forwards all requests to your Ollama server. Simply replace the Ollama base URL with the proxy URL.
                </p>
              </div>

              <div>
                <p className="mb-2">
                  <strong>Authentication:</strong>
                </p>
                <p className="text-xs mb-2">
                  Add your API key in the request headers using either method:
                </p>
                <ul className="text-xs list-disc list-inside space-y-1 ml-2">
                  <li>
                    <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">Authorization: Bearer YOUR_API_KEY</code>
                  </li>
                  <li>
                    <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">X-API-Key: YOUR_API_KEY</code>
                  </li>
                </ul>
              </div>

              <div>
                <p className="mb-2">
                  <strong>Supported Ollama APIs:</strong>
                </p>
                <p className="text-xs mb-2">Use either <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">/api/proxy/tags</code> or <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">/api/proxy/api/tags</code></p>
                <ul className="text-xs list-disc list-inside space-y-1 ml-2">
                  <li><code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">/api/proxy/generate</code> - Generate completion</li>
                  <li><code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">/api/proxy/chat</code> - Chat completion</li>
                  <li><code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">/api/proxy/tags</code> - List models</li>
                  <li><code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">/api/proxy/show</code> - Show model info</li>
                  <li><code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">/api/proxy/pull</code> - Pull a model</li>
                  <li><code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">/api/proxy/push</code> - Push a model</li>
                  <li><code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">/api/proxy/embeddings</code> - Generate embeddings</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">
              Examples
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                  Chat Completion:
                </p>
                <pre className="bg-green-100 dark:bg-green-900 p-3 rounded overflow-x-auto text-xs text-green-800 dark:text-green-200">
{`curl ${baseUrl}/api/proxy/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "llama2",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'`}
                </pre>
              </div>

              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                  List Models:
                </p>
                <pre className="bg-green-100 dark:bg-green-900 p-3 rounded overflow-x-auto text-xs text-green-800 dark:text-green-200">
{`curl ${baseUrl}/api/proxy/tags \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                </pre>
              </div>

              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                  Generate Completion (Streaming):
                </p>
                <pre className="bg-green-100 dark:bg-green-900 p-3 rounded overflow-x-auto text-xs text-green-800 dark:text-green-200">
{`curl ${baseUrl}/api/proxy/generate \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "llama2",
    "prompt": "Why is the sky blue?",
    "stream": true
  }'`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
