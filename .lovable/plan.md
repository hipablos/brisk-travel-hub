# Plano: Hospedagens, Experiências Turísticas e Calendário

Trabalho grande — proponho dividir em 3 fases entregáveis em sequência. Confirme antes de eu começar.

## Fase 1 — Hospedagens

**Banco (migration):**
- Tabela `hospedagens`: cotacao_id (fk, opcional), cliente_id, nome_hotel, estrelas, endereco, cidade, estado, pais, google_place_id, google_maps_url, lat, lng, checkin (timestamptz), checkout (timestamptz), noites, hospedes, quartos, tipo_acomodacao, regime_alimentar (enum), numero_reserva, codigo_confirmacao, observacoes_cliente, created_by, timestamps.
- RLS: authenticated full CRUD; GRANTs + service_role.

**Frontend:**
- Nova rota `/hospedagens` (sidebar grupo "Acompanhamentos") — lista + dialog de cadastro/edição.
- Componente `HotelAutocomplete` usando conector Google Maps Platform (Places API New via gateway server fn) para preencher nome/endereço/cidade/estado/país/place_id/maps_url/lat/lng.
- Permitir preenchimento manual (fallback).
- Vincular à cotação: seletor de cotação no form + aba "Hospedagens" dentro da cotação.
- PDF da reserva: incluir bloco Hospedagem (sem valores, sem link Google Maps).

## Fase 2 — Experiências Turísticas

**Banco:**
- Tabela `experiencias`: cotacao_id, cliente_id, nome, categoria, endereco, cidade, estado, pais, google_place_id, lat, lng, data, hora_inicio, hora_termino, duracao_min, participantes, idioma, idade_minima, descricao, created_by, timestamps.
- RLS idêntica ao padrão.

**Frontend:**
- Rota `/experiencias` (sidebar "Acompanhamentos").
- Lista + dialog com autocomplete Google Maps para endereço.
- Vínculo com cotação e aba dedicada.
- PDF reserva: bloco Experiências (nome, data, local, início/término, duração — sem valores).

## Fase 3 — Calendário Operacional

**Banco:**
- Tabela `calendario_eventos` (anotações manuais): titulo, data, hora, cliente_id, cotacao_id, categoria, prioridade, descricao, notif_um_dia_antes, notif_duas_horas_antes, notif_no_horario, telegram_sent_flags, created_by, timestamps.
- Cron `pg_cron` chamando `/api/public/hooks/calendario-notificar` a cada 5 min para disparar alertas Telegram.

**Frontend:**
- Aprimorar página Calendário existente com 4 visualizações: mês (grade), semana (grade), dia (agenda), lista cronológica. Botão "Hoje".
- Fonte unificada de eventos (agregador client-side) com cores por tipo:
  - Voos (ida/volta) — das cotações/reservas
  - Check-in/Check-out (hospedagens)
  - Experiências
  - Tarefas com prazo
  - Follow-ups
  - Compromissos financeiros (formas_pagamento/vendas)
  - Anotações manuais
- Filtros: cliente, categoria, responsável, tipo de evento, período.
- Dialog "Nova anotação" com todos os campos + checkboxes de notificação Telegram.

**Integração Telegram:**
- Server route público que varre `calendario_eventos` + eventos derivados pendentes e envia via bot configurado em `telegram_config`.

## Dependências técnicas
- Conector Google Maps Platform já listado nas instruções — usar `places/v1/places:searchText` e `places/v1/places/{id}` via gateway server fn.
- `@tanstack/react-query` para cache de listas.
- date-fns (já no projeto) para o calendário; sem nova lib se possível, ou `react-day-picker` para visão mensal (já temos).

## Confirmações que preciso
1. **Posso seguir as 3 fases na ordem (1 → 2 → 3) em mensagens separadas?** Cada fase fica funcional sozinha.
2. **Google Maps Platform**: ok eu conectar o conector agora (necessário para autocomplete de hotéis/experiências)?
3. **PDF da reserva**: confirme que existe um gerador atual a estender — vou inspecionar `src/routes/reserva_.$id.tsx` e adicionar as seções novas mantendo o layout.
4. **Calendário existente**: não localizei rota `calendario`. Devo criar nova em `/calendario` e adicionar no sidebar (grupo Acompanhamentos)?

Responda "ok" + respostas às 4 perguntas e começo pela Fase 1.