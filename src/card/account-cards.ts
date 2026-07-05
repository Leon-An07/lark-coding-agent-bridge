import type { TenantBrand } from '../config/schema';
import { msgs } from '../i18n';

function maskAppId(id: string): string {
  if (id.length < 12) return id;
  return `${id.slice(0, 13)}****${id.slice(-2)}`;
}

export interface CurrentInfo {
  appId: string;
  botName?: string;
  tenant: TenantBrand;
}

export function accountCurrentCard(info: CurrentInfo): object {
  const m = msgs().cards;
  return {
    schema: '2.0',
    config: { summary: { content: m.accountCurrentSummary } },
    body: {
      elements: [
        {
          tag: 'markdown',
          content: m.accountCurrentBody(
            maskAppId(info.appId),
            info.botName ?? m.unknownValue,
            info.tenant,
          ),
        },
        { tag: 'hr' },
        {
          tag: 'button',
          text: { tag: 'plain_text', content: m.accountChangeLabel },
          type: 'primary',
          behaviors: [{ type: 'callback', value: { cmd: 'account.change' } }],
        },
      ],
    },
  };
}

export interface FormCardOpts {
  initialTenant?: TenantBrand;
  prefillAppId?: string;
  errorMessage?: string;
}

export function accountFormCard(opts: FormCardOpts = {}): object {
  const m = msgs().cards;
  const { initialTenant = 'feishu', prefillAppId, errorMessage } = opts;
  const bodyElements: object[] = [];
  if (errorMessage) {
    bodyElements.push({
      tag: 'markdown',
      content: m.accountValidationFailedInline(errorMessage),
    });
  }
  bodyElements.push({
    tag: 'form',
    name: 'account_form',
    elements: [
      {
        tag: 'input',
        name: 'app_id',
        label: { tag: 'plain_text', content: 'App ID' },
        placeholder: { tag: 'plain_text', content: 'cli_xxxxxxxxxxxx' },
        ...(prefillAppId ? { default_value: prefillAppId } : {}),
        required: true,
      },
      {
        tag: 'input',
        name: 'app_secret',
        label: { tag: 'plain_text', content: 'App Secret' },
        placeholder: { tag: 'plain_text', content: m.appSecretPlaceholder },
        // Never prefill secret — even on validation retry. Pre-filled secrets
        // can leak into Lark's server-side card cache.
        required: true,
      },
      { tag: 'markdown', content: '**Tenant**' },
      {
        tag: 'select_static',
        name: 'tenant',
        initial_option: initialTenant,
        options: [
          { text: { tag: 'plain_text', content: m.tenantFeishu }, value: 'feishu' },
          { text: { tag: 'plain_text', content: m.tenantLark }, value: 'lark' },
        ],
      },
      {
        tag: 'column_set',
        flex_mode: 'flow',
        horizontal_spacing: 'small',
        columns: [
          {
            tag: 'column',
            width: 'auto',
            elements: [
              {
                tag: 'button',
                name: 'submit_btn',
                text: { tag: 'plain_text', content: m.submit },
                type: 'primary',
                form_action_type: 'submit',
                behaviors: [{ type: 'callback', value: { cmd: 'account.submit' } }],
              },
            ],
          },
          {
            tag: 'column',
            width: 'auto',
            elements: [
              {
                tag: 'button',
                name: 'cancel_btn',
                text: { tag: 'plain_text', content: m.cancel },
                behaviors: [{ type: 'callback', value: { cmd: 'account.cancel' } }],
              },
            ],
          },
        ],
      },
    ],
  });

  return {
    schema: '2.0',
    config: { summary: { content: m.accountChangeLabel } },
    body: { elements: bodyElements },
  };
}

export function accountValidatingCard(): object {
  const m = msgs().cards;
  return {
    schema: '2.0',
    config: { summary: { content: m.accountValidatingSummary } },
    body: { elements: [{ tag: 'markdown', content: m.accountValidatingBody }] },
  };
}

export function accountSuccessCard(info: CurrentInfo): object {
  const m = msgs().cards;
  return {
    schema: '2.0',
    config: { summary: { content: m.accountSavedSummary } },
    body: {
      elements: [
        {
          tag: 'markdown',
          content: m.accountSuccessBody(maskAppId(info.appId), info.botName, info.tenant),
        },
      ],
    },
  };
}

export function accountFailureCard(reason: string): object {
  const m = msgs().cards;
  return {
    schema: '2.0',
    config: { summary: { content: m.accountFailureSummary } },
    body: {
      elements: [
        {
          tag: 'markdown',
          content: m.accountFailureBody(reason),
        },
      ],
    },
  };
}

export function accountCancelledCard(): object {
  const m = msgs().cards;
  return {
    schema: '2.0',
    config: { summary: { content: m.cancelledSummary } },
    body: { elements: [{ tag: 'markdown', content: m.accountCancelledBody }] },
  };
}
