import { createAgent, createTool, OpenAIAdapter } from 'agent-sdk';
import { z } from 'zod';

const billingAgent = createAgent()
    .name('BillingAgent')
    .instructions('Handle payment and subscription inquiries.')
    .llm(new OpenAIAdapter())
    .build();

const supportAgent = createAgent()
    .name('SupportAgent')
    .instructions('Primary triage agent. Hand off to BillingAgent for payments.')
    .llm(new OpenAIAdapter())
    .subAgent('BillingAgent', billingAgent)
    .debug(true)
    .build();

async function main() {
    const result = await supportAgent.run('I need help refunding my latest charge.');
    console.log('Result:', result.output);
}

main().catch(console.error);
