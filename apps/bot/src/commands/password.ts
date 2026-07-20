import { SlashCommandBuilder } from 'discord.js'
import type { ChatInputCommandInteraction, LocalizationMap } from 'discord.js'
import type { TranslationKey } from '@nbenhadi/mirror-i18n'
import { execute } from '@nbenhadi/mirror-core'
import { STRENGTH_KEYS, WARNING_KEYS } from '@nbenhadi/mirror-password'
import type { CheckResult, PassphraseResult } from '@nbenhadi/mirror-password'
import type { Command } from '../types/command.js'
import { cap, en, getT, localize } from '../i18n.js'

const MIN_LENGTH = 8
const MAX_LENGTH = 128
const MIN_WORDS = 3
const MAX_WORDS = 20

export const password: Command = {
  data: new SlashCommandBuilder()
    .setName('password')
    .setDescription(cap(en('cmd.password.description')))
    .setDescriptionLocalizations(localize('cmd.password.description') as LocalizationMap)
    .addSubcommand((sub) =>
      sub
        .setName('generate')
        .setDescription(cap(en('cmd.password.generate.description')))
        .setDescriptionLocalizations(
          localize('cmd.password.generate.description') as LocalizationMap
        )
        .addIntegerOption((o) =>
          o
            .setName('length')
            .setDescription(
              cap(en('cmd.password.generate.opt.length', { min: MIN_LENGTH, max: MAX_LENGTH }))
            )
            .setDescriptionLocalizations(
              localize('cmd.password.generate.opt.length', {
                min: MIN_LENGTH,
                max: MAX_LENGTH,
              }) as LocalizationMap
            )
            .setMinValue(MIN_LENGTH)
            .setMaxValue(MAX_LENGTH)
        )
        .addBooleanOption((o) =>
          o
            .setName('uppercase')
            .setDescription(cap(en('cmd.password.generate.opt.no_uppercase')))
            .setDescriptionLocalizations(
              localize('cmd.password.generate.opt.no_uppercase') as LocalizationMap
            )
        )
        .addBooleanOption((o) =>
          o
            .setName('numbers')
            .setDescription(cap(en('cmd.password.generate.opt.no_numbers')))
            .setDescriptionLocalizations(
              localize('cmd.password.generate.opt.no_numbers') as LocalizationMap
            )
        )
        .addBooleanOption((o) =>
          o
            .setName('symbols')
            .setDescription(cap(en('cmd.password.generate.opt.symbols')))
            .setDescriptionLocalizations(
              localize('cmd.password.generate.opt.symbols') as LocalizationMap
            )
        )
        .addBooleanOption((o) =>
          o
            .setName('exclude_ambiguous')
            .setDescription(cap(en('cmd.password.generate.opt.exclude_ambiguous')))
            .setDescriptionLocalizations(
              localize('cmd.password.generate.opt.exclude_ambiguous') as LocalizationMap
            )
        )
        .addBooleanOption((o) =>
          o
            .setName('require_each')
            .setDescription(cap(en('cmd.password.generate.opt.require_each')))
            .setDescriptionLocalizations(
              localize('cmd.password.generate.opt.require_each') as LocalizationMap
            )
        )
        .addBooleanOption((o) =>
          o
            .setName('no_repeat')
            .setDescription(cap(en('cmd.password.generate.opt.no_repeat')))
            .setDescriptionLocalizations(
              localize('cmd.password.generate.opt.no_repeat') as LocalizationMap
            )
        )
        .addStringOption((o) =>
          o
            .setName('exclude')
            .setDescription(cap(en('cmd.password.generate.opt.exclude')))
            .setDescriptionLocalizations(
              localize('cmd.password.generate.opt.exclude') as LocalizationMap
            )
        )
        .addStringOption((o) =>
          o
            .setName('include')
            .setDescription(cap(en('cmd.password.generate.opt.include')))
            .setDescriptionLocalizations(
              localize('cmd.password.generate.opt.include') as LocalizationMap
            )
        )
        .addStringOption((o) =>
          o
            .setName('separator')
            .setDescription(cap(en('cmd.password.generate.opt.separator')))
            .setDescriptionLocalizations(
              localize('cmd.password.generate.opt.separator') as LocalizationMap
            )
            .setMaxLength(1)
        )
        .addIntegerOption((o) =>
          o
            .setName('every')
            .setDescription(cap(en('cmd.password.generate.opt.every')))
            .setDescriptionLocalizations(
              localize('cmd.password.generate.opt.every') as LocalizationMap
            )
            .setMinValue(1)
            .setMaxValue(128)
        )
        .addStringOption((o) =>
          o
            .setName('prefix')
            .setDescription(cap(en('cmd.password.generate.opt.prefix')))
            .setDescriptionLocalizations(
              localize('cmd.password.generate.opt.prefix') as LocalizationMap
            )
        )
        .addStringOption((o) =>
          o
            .setName('suffix')
            .setDescription(cap(en('cmd.password.generate.opt.suffix')))
            .setDescriptionLocalizations(
              localize('cmd.password.generate.opt.suffix') as LocalizationMap
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('check')
        .setDescription(cap(en('cmd.password.check.description')))
        .setDescriptionLocalizations(localize('cmd.password.check.description') as LocalizationMap)
        .addStringOption((o) =>
          o
            .setName('password')
            .setDescription(cap(en('cmd.password.check.opt.password')))
            .setDescriptionLocalizations(
              localize('cmd.password.check.opt.password') as LocalizationMap
            )
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('passphrase')
        .setDescription(cap(en('cmd.password.passphrase.description')))
        .setDescriptionLocalizations(
          localize('cmd.password.passphrase.description') as LocalizationMap
        )
        .addIntegerOption((o) =>
          o
            .setName('words')
            .setDescription(
              cap(en('cmd.password.passphrase.opt.words', { min: MIN_WORDS, max: MAX_WORDS }))
            )
            .setDescriptionLocalizations(
              localize('cmd.password.passphrase.opt.words', {
                min: MIN_WORDS,
                max: MAX_WORDS,
              }) as LocalizationMap
            )
            .setMinValue(MIN_WORDS)
            .setMaxValue(MAX_WORDS)
        )
        .addStringOption((o) =>
          o
            .setName('separator')
            .setDescription(cap(en('cmd.password.passphrase.opt.separator')))
            .setDescriptionLocalizations(
              localize('cmd.password.passphrase.opt.separator') as LocalizationMap
            )
        )
        .addBooleanOption((o) =>
          o
            .setName('capitalize')
            .setDescription(cap(en('cmd.password.passphrase.opt.capitalize')))
            .setDescriptionLocalizations(
              localize('cmd.password.passphrase.opt.capitalize') as LocalizationMap
            )
        )
        .addBooleanOption((o) =>
          o
            .setName('number')
            .setDescription(cap(en('cmd.password.passphrase.opt.number')))
            .setDescriptionLocalizations(
              localize('cmd.password.passphrase.opt.number') as LocalizationMap
            )
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const t = getT(interaction.locale)
    const o = interaction.options
    const sub = o.getSubcommand()

    if (sub === 'generate') {
      const separatorChar = o.getString('separator')
      const excludeVal = o.getString('exclude')
      const includeVal = o.getString('include')
      const prefixVal = o.getString('prefix')
      const suffixVal = o.getString('suffix')

      const result = await execute<{ password: string }>({
        toolId: 'password',
        input: {
          action: 'generate',
          length: o.getInteger('length') ?? 16,
          uppercase: o.getBoolean('uppercase') ?? true,
          numbers: o.getBoolean('numbers') ?? true,
          symbols: o.getBoolean('symbols') ?? false,
          excludeAmbiguous: o.getBoolean('exclude_ambiguous') ?? false,
          requireEach: o.getBoolean('require_each') ?? false,
          noRepeat: o.getBoolean('no_repeat') ?? false,
          ...(excludeVal !== null ? { exclude: excludeVal } : {}),
          ...(includeVal !== null ? { include: includeVal } : {}),
          ...(separatorChar !== null
            ? { separator: { char: separatorChar, every: o.getInteger('every') ?? 4 } }
            : {}),
          ...(prefixVal !== null ? { prefix: prefixVal } : {}),
          ...(suffixVal !== null ? { suffix: suffixVal } : {}),
        },
      })

      if (!result.success) {
        await interaction.reply({
          content: cap(t(result.error.message as TranslationKey, result.error.params)),
          ephemeral: true,
        })
        return
      }

      await interaction.reply({
        content: `\`\`\`\n${result.data.password}\n\`\`\``,
        ephemeral: true,
      })
      return
    }

    if (sub === 'check') {
      const result = await execute<CheckResult>({
        toolId: 'password',
        input: { action: 'check', password: o.getString('password', true) },
      })

      if (!result.success) {
        await interaction.reply({
          content: cap(t(result.error.message as TranslationKey, result.error.params)),
          ephemeral: true,
        })
        return
      }

      const d = result.data
      const lines: string[] = [
        `**${cap(t('cmd.password.check.label.strength'))}:** ${cap(t(STRENGTH_KEYS[d.label]))} (${d.score}/4)`,
        `**${cap(t('cmd.password.check.label.entropy'))}:** ${d.effectiveBits} bits`,
        `**${cap(t('cmd.password.check.label.crack_time'))}:** ${d.crackTime}`,
      ]

      if (d.warnings.length > 0) {
        lines.push(`**${cap(t('cmd.password.check.label.warnings'))}:**`)
        for (const w of d.warnings) {
          const params = w === 'too-short' ? { min: 8 } : undefined
          lines.push(`- ${cap(t(WARNING_KEYS[w], params))}`)
        }
      }

      await interaction.reply({ content: lines.join('\n'), ephemeral: true })
      return
    }

    if (sub === 'passphrase') {
      const separatorVal = o.getString('separator')

      const result = await execute<PassphraseResult>({
        toolId: 'password',
        input: {
          action: 'passphrase',
          words: o.getInteger('words') ?? 6,
          separator: separatorVal !== null ? separatorVal : '-',
          capitalize: o.getBoolean('capitalize') ?? false,
          number: o.getBoolean('number') ?? false,
        },
      })

      if (!result.success) {
        await interaction.reply({
          content: cap(t(result.error.message as TranslationKey, result.error.params)),
          ephemeral: true,
        })
        return
      }

      await interaction.reply({
        content: `\`\`\`\n${result.data.passphrase}\n\`\`\``,
        ephemeral: true,
      })
    }
  },
}
