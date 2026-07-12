#!/usr/bin/env node
/**
 * state-machine.js — Máquina de Estados do Pipeline
 * AchadoCerto.VIP — Agente Autônomo
 *
 * Estados:
 *   PENDING → PRODUCT_SELECTED → PRODUCT_VALIDATED →
 *   CONTENT_GENERATED → QUALITY_APPROVED → FILES_WRITTEN →
 *   READY_TO_COMMIT → COMMITTED → VERIFIED → DONE
 *
 * Se o processo cair, a PRÓXIMA execução continua do estado atual.
 * Cada estado tem um handler associado.
 *
 * Uso:
 *   const sm = createStateMachine(runId, pillar);
 *   await sm.run();  // executa do estado atual até DONE ou FAIL
 *   sm.getState();   // estado atual
 *   sm.canTransitionTo('CONTENT_GENERATED'); // true/false
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);

const AGENT_DIR    = path.resolve(__dirname, '..');
const STATES_DIR   = path.join(AGENT_DIR, 'states');
fs.mkdirSync(STATES_DIR, { recursive: true });

// ── Definição dos estados ───────────────────────────────────────────────────

const STATES = {
  PENDING:            { order: 0,  label: 'Pendente' },
  PRODUCT_SELECTED:   { order: 10, label: 'Produto Selecionado' },
  PRODUCT_VALIDATED:  { order: 20, label: 'Produto Validado' },
  CONTENT_GENERATED:  { order: 30, label: 'Conteúdo Gerado' },
  QUALITY_APPROVED:   { order: 40, label: 'Qualidade Aprovada' },
  AUDIT:              { order: 45, label: 'Auditoria Final' },
  FILES_WRITTEN:      { order: 50, label: 'Arquivos Escritos' },
  READY_TO_COMMIT:    { order: 60, label: 'Pronto para Commit' },
  COMMITTED:          { order: 70, label: 'Commitado' },
  DEPLOYED:           { order: 75, label: 'Deployado' },
  VERIFIED:           { order: 80, label: 'Verificado' },
  DONE:               { order: 90, label: 'Concluído' },
  FAIL:               { order: 99, label: 'Falhou' },
};

const STATE_KEYS = Object.keys(STATES);

/**
 * Mapa de transições válidas entre estados.
 * Cada chave pode ir para os valores listados.
 */
const TRANSITIONS = {
  PENDING:            ['PRODUCT_SELECTED', 'FAIL'],
  PRODUCT_SELECTED:   ['PRODUCT_VALIDATED', 'PENDING', 'FAIL'],
  PRODUCT_VALIDATED:  ['CONTENT_GENERATED', 'PRODUCT_SELECTED', 'FAIL'],
  CONTENT_GENERATED:  ['QUALITY_APPROVED', 'PRODUCT_SELECTED', 'FAIL'],
  QUALITY_APPROVED:   ['AUDIT', 'PRODUCT_SELECTED', 'FAIL'],
  AUDIT:              ['FILES_WRITTEN', 'PRODUCT_SELECTED', 'FAIL'],
  FILES_WRITTEN:      ['READY_TO_COMMIT', 'PRODUCT_SELECTED', 'FAIL'],
  READY_TO_COMMIT:    ['COMMITTED', 'FAIL'],
  COMMITTED:          ['DEPLOYED', 'FAIL'],
  DEPLOYED:           ['VERIFIED', 'FAIL'],
  VERIFIED:           ['DONE', 'FAIL'],
  DONE:               [],
  FAIL:               ['PENDING'],
};

// ── API da State Machine ────────────────────────────────────────────────────

/**
 * Cria ou recupera uma máquina de estados para uma execução.
 *
 * @param {string} executionId - ID único da execução (ex: 20260711-080000-abc123)
 * @param {object} [meta] - Metadados opcionais
 * @returns {object} state machine com métodos .getState, .transition, .run, .reset
 */
export function createStateMachine(executionId, meta = {}) {
  const stateFile = path.join(STATES_DIR, `${executionId}.json`);
  let currentState = 'PENDING';
  let context = { executionId, ...meta, transitions: [], errors: [] };

  // Tenta recuperar estado salvo (resume)
  function load() {
    try {
      if (fs.existsSync(stateFile)) {
        const saved = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        if (saved.state && STATE_KEYS.includes(saved.state)) {
          currentState = saved.state;
          context = { ...context, ...saved.context };
          return true;
        }
      }
    } catch (_) {}
    return false;
  }

  function save() {
    try {
      fs.mkdirSync(path.dirname(stateFile), { recursive: true });
      fs.writeFileSync(stateFile, JSON.stringify({
        state: currentState,
        context: {
          executionId: context.executionId,
          pillar: context.pillar,
          transitions: context.transitions,
          errors: context.errors.slice(-10),
        },
        updatedAt: new Date().toISOString(),
      }, null, 2));
    } catch (_) {}
  }

  load();

  return {
    /** Estado atual */
    getState: () => currentState,

    /** Contexto da execução */
    getContext: () => ({ ...context }),

    /** Atualiza contexto */
    setContext: (updates) => {
      context = { ...context, ...updates };
      save();
    },

    /** Verifica se pode transicionar para o estado alvo */
    canTransitionTo: (targetState) => {
      return (TRANSITIONS[currentState] || []).includes(targetState);
    },

    /** Tenta transicionar para o estado alvo */
    transition: (targetState, data = {}) => {
      const allowed = TRANSITIONS[currentState] || [];
      if (!allowed.includes(targetState)) {
        const err = `Transição inválida: ${currentState} → ${targetState} (permitidas: ${allowed.join(', ') || 'nenhuma'})`;
        context.errors.push({ from: currentState, to: targetState, error: err, ts: new Date().toISOString() });
        save();
        return { success: false, error: err };
      }

      const prevState = currentState;
      currentState = targetState;
      context.transitions.push({
        from: prevState,
        to: targetState,
        ts: new Date().toISOString(),
        ...data,
      });
      save();
      return { success: true, from: prevState, to: targetState };
    },

    /** Reseta para PENDING */
    reset: () => {
      currentState = 'PENDING';
      context.transitions = [];
      context.errors = [];
      save();
    },

    /** Salva erro sem mudar estado */
    addError: (error, data = {}) => {
      context.errors.push({ state: currentState, error, ts: new Date().toISOString(), ...data });
      save();
    },

    /** Remove o arquivo de estado (limpeza) */
    cleanup: () => {
      try { fs.unlinkSync(stateFile); } catch (_) {}
    },

    /** Caminho completo até aqui */
    getPath: () => context.transitions.map(t => `${t.from}→${t.to}`).join(' › '),

    /** Resumo legível */
    getSummary: () => {
      const lastError = context.errors[context.errors.length - 1];
      return {
        state: currentState,
        label: STATES[currentState]?.label || currentState,
        transitions: context.transitions.length,
        errors: context.errors.length,
        lastError: lastError?.error || null,
        executionId,
      };
    },
  };
}

/**
 * Lista execuções recentes disponíveis para resume.
 */
export function listExecutions() {
  try {
    if (!fs.existsSync(STATES_DIR)) return [];
    return fs.readdirSync(STATES_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(STATES_DIR, f), 'utf8'));
          return {
            id: f.replace('.json', ''),
            state: data.state,
            updatedAt: data.updatedAt,
            pillar: data.context?.pillar,
          };
        } catch { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
      .slice(0, 20);
  } catch { return []; }
}
