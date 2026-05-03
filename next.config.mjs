/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Mantém `ws` (e suas optional deps nativas bufferutil/utf-8-validate) fora do bundle
  // do webpack. Sem isso, o WebSocket no servidor falha com "bufferUtil.mask is not a function".
  experimental: {
    serverComponentsExternalPackages: ['ws', 'bufferutil', 'utf-8-validate'],
  },
};

export default nextConfig;
