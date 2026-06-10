import type { NextConfig } from "next";
import path from "path";

const trackingSrc = path.resolve(__dirname, "Tracking/src");

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  webpack: (config) => {
    config.resolve.plugins = config.resolve.plugins ?? [];
    config.resolve.plugins.push({
      apply(resolver: {
        getHook: (name: string) => { tapAsync: (...args: unknown[]) => void };
        ensureHook: (name: string) => unknown;
        doResolve: (
          hook: unknown,
          request: { request?: string; context?: { issuer?: string } },
          message: string | null,
          resolveContext: unknown,
          callback: (err?: Error | null, result?: unknown) => void,
        ) => void;
      }) {
        const target = resolver.ensureHook("resolve");
        resolver
          .getHook("resolve")
          .tapAsync(
            "TrackingInternalAlias",
            (
              request: { request?: string; context?: { issuer?: string } },
              resolveContext: unknown,
              callback: (err?: Error | null, result?: unknown) => void,
            ) => {
              const issuer = request.context?.issuer ?? "";
              const isTrackingModule = issuer.includes(
                `${path.sep}Tracking${path.sep}src${path.sep}`,
              );

              if (
                !isTrackingModule ||
                !request.request?.startsWith("@/")
              ) {
                callback();
                return;
              }

              const resolved = path.join(trackingSrc, request.request.slice(2));
              resolver.doResolve(
                target,
                { ...request, request: resolved },
                `Tracking alias: ${request.request}`,
                resolveContext,
                callback,
              );
            },
          );
      },
    });

    return config;
  },
};

export default nextConfig;
