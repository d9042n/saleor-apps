import { createLogger } from "@saleor/apps-shared";
import { WebhookProductFragment, WebhookProductVariantFragment } from "../../../generated/graphql";
import { ProvidersConfig } from "../configuration";
import { ProvidersResolver } from "../providers/providers-resolver";
import { WebhookContext } from "./create-webhook-config-context";
import { ProductWebhooksProcessor } from "./product-webhooks-processor";

type ProcessorFactory = (config: ProvidersConfig.AnyFullShape) => ProductWebhooksProcessor;

export class WebhooksProcessorsDelegator {
  private processorFactory: ProcessorFactory = ProvidersResolver.createWebhooksProcessor;
  private logger = createLogger({ name: "WebhooksProcessorsDelegator" });

  constructor(
    private opts: {
      context: WebhookContext;
      injectProcessorFactory?: ProcessorFactory;
    }
  ) {
    if (opts.injectProcessorFactory) {
      this.processorFactory = opts.injectProcessorFactory;
    }

    this.logger.trace("WebhooksProcessorsDelegator created");
  }

  private extractChannelSlugsFromProductVariant(productVariant: WebhookProductVariantFragment) {
    return productVariant.channelListings?.map((c) => c.channel.slug);
  }

  private mapConnectionsToProcessors(connections: WebhookContext["connections"]) {
    return connections.map((conn) => {
      const providerConfig = this.opts.context.providers.find((p) => p.id === conn.providerId);

      if (!providerConfig) {
        this.logger.error({ connection: conn }, "Cant resolve provider from connection");

        throw new Error("Cant resolve provider from connection");
      }

      return this.processorFactory(providerConfig);
    });
  }

  async delegateVariantCreatedOperations(productVariant: WebhookProductVariantFragment) {
    this.logger.trace("delegateVariantCreatedOperations called");

    const { connections } = this.opts.context;
    const relatedVariantChannels = this.extractChannelSlugsFromProductVariant(productVariant);

    if (!relatedVariantChannels || relatedVariantChannels.length === 0) {
      this.logger.trace("No related channels found for variant, skipping");

      return;
    }

    const connectionsToInclude = connections.filter((conn) =>
      relatedVariantChannels.includes(conn.channelSlug)
    );

    this.logger.trace(
      { connections: connectionsToInclude.length },
      "Resolved a number of connections to include"
    );

    const processors = this.mapConnectionsToProcessors(connectionsToInclude);

    this.logger.trace(
      { processors: processors.length },
      "Resolved a number of processor to delegate to"
    );

    return Promise.all(
      processors.map((processor) => {
        this.logger.trace("Calling processor.onProductVariantCreated");

        return processor.onProductVariantCreated(productVariant);
      })
    );
  }

  async delegateVariantUpdatedOperations(productVariant: WebhookProductVariantFragment) {
    const { connections } = this.opts.context;
    const relatedVariantChannels = this.extractChannelSlugsFromProductVariant(productVariant);

    if (!relatedVariantChannels || relatedVariantChannels.length === 0) {
      return;
    }

    const connectionsToInclude = connections.filter((conn) =>
      relatedVariantChannels.includes(conn.channelSlug)
    );

    const processors = this.mapConnectionsToProcessors(connectionsToInclude);

    return Promise.all(
      processors.map((processor) => {
        return processor.onProductVariantUpdated(productVariant);
      })
    );
  }

  async delegateVariantDeletedOperations(productVariant: WebhookProductVariantFragment) {
    const { connections } = this.opts.context;

    const processors = this.mapConnectionsToProcessors(connections);

    return Promise.all(
      processors.map((processor) => {
        return processor.onProductVariantDeleted(productVariant);
      })
    );
  }

  async delegateProductUpdatedOperations(product: WebhookProductFragment) {
    const { connections } = this.opts.context;

    const processors = this.mapConnectionsToProcessors(connections);

    return Promise.all(
      processors.map((processor) => {
        return processor.onProductUpdated(product);
      })
    );
  }
}