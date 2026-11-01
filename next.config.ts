// Upload foto lewat Server Action butuh batas body lebih besar dari default 1 MB.
const config = { experimental: { serverActions: { bodySizeLimit: "25mb" as const } } };
export default config;
