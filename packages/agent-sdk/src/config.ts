import dotenv from 'dotenv';

// Automatically load environment variables from .env file
dotenv.config();

/**
 * Resolves the branding name of the Agent SDK.
 * Resolution precedence:
 * 1. Explicit override passed in code (e.g. `builder.name("MySdk")`)
 * 2. Environment variable `SDK_NAME`
 * 3. Environment variable `AGENT_SDK_NAME`
 * 4. Default fallback: `"AgentSDK"`
 */
export function getSdkName(overrideName?: string): string {
    if (overrideName && overrideName.trim().length > 0) {
        return overrideName.trim();
    }

    const envName = process.env.SDK_NAME || process.env.AGENT_SDK_NAME;

    if (envName && envName.trim().length > 0) {
        return envName.trim();
    }

    return 'AgentSDK';
}
