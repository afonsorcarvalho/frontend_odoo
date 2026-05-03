# TODO — frontend_odoo

## Em curso

## Pendente

### Ciclos

## Feito

### Ciclos / Laudos
- Modal de seleção de materiais antes de imprimir Laudo de Liberação: agrupa por fabricante, gera PDF restrito à seleção via novo controller `/laudo/render` (auth user)

### Infra
- Docker produção: Dockerfile multi-stage standalone, compose com healthcheck, sem dependência de env vars Odoo (login resolve URL dinâmico)
- Fix build: hooks condicionais em `app/ciclos/page.tsx`, vars não usadas em `ChecklistManagerModal` e `OsDetail`
- Fix bailout `/login`: `app/login/layout.tsx` com `dynamic = 'force-dynamic'` + filtro no `ErrorReporter`

### Ciclos
- Leitura de permissões: ocultar módulos, campos e actions não permitidos ao utilizador
- Edição de indicador biológico e materiais do ciclo
- Forçar ciclo atrasado como concluído (máquina desligada sem registar fim de ciclo)
- Mostrar duração prevista em horas e minutos
- Anexar fotos ao ciclo
