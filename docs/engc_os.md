# engc.os

Gerado em: 2026-04-19T09:22:56.539Z
Servidor: mb.fitadigital.com.br / mb-odoo
Total de registros: 0

## Campos (76)

| Campo | Tipo | Label | Obrig. | RO | Relation |
|-------|------|-------|--------|----|----------|
| `__last_update` | datetime | Last Modified on |  | ✓ |  |
| `activity_date_deadline` | date | Next Activity Deadline |  | ✓ |  |
| `activity_exception_decoration` | selection (2 opções) | Activity Exception Decoration |  | ✓ |  |
| `activity_exception_icon` | char | Icon |  | ✓ |  |
| `activity_ids` | one2many | Activities |  |  | mail.activity |
| `activity_state` | selection (3 opções) | Activity State |  | ✓ |  |
| `activity_summary` | char | Next Activity Summary |  |  |  |
| `activity_type_icon` | char | Activity Type Icon |  | ✓ |  |
| `activity_type_id` | many2one | Next Activity Type |  |  | mail.activity.type |
| `activity_user_id` | many2one | Responsible User |  |  | res.users |
| `calibration_created` | boolean | Calibração criada |  |  |  |
| `calibration_id` | many2one | Calibração Cod. |  |  | engc.calibration |
| `check_list_count` | integer | Check List Count |  | ✓ |  |
| `check_list_created` | boolean | Check List Created |  |  |  |
| `check_list_id` | one2many | Check-list |  |  | engc.os.verify.checklist |
| `client_id` | many2one | Cliente |  |  | res.partner |
| `company_id` | many2one | Instituição | ✓ |  | res.company |
| `create_date` | datetime | Created on |  | ✓ |  |
| `create_uid` | many2one | Created by |  | ✓ | res.users |
| `date_execution` | datetime | Data de Execução |  |  |  |
| `date_finish` | datetime | Término da Execução |  |  |  |
| `date_request` | datetime | Data Requisição | ✓ |  |  |
| `date_scheduled` | datetime | Data Programada | ✓ |  |  |
| `date_start` | datetime | Início da Execução |  |  |  |
| `department` | many2one | Departamento |  |  | hr.department |
| `display_name` | char | Display Name |  | ✓ |  |
| `empresa_manutencao` | many2one | Empresa |  |  | res.partner |
| `equipment_apelido` | char | Apelido |  | ✓ |  |
| `equipment_category` | char | Categoria |  | ✓ |  |
| `equipment_id` | many2one | Equipamento | ✓ |  | engc.equipment |
| `equipment_model` | char | Modelo |  | ✓ |  |
| `equipment_patrimonio` | char | Patrimonio do Equipamento |  | ✓ |  |
| `equipment_serial_number` | char | Número de Série |  | ✓ |  |
| `equipment_tag` | char | Tag |  | ✓ |  |
| `has_message` | boolean | Has Message |  | ✓ |  |
| `id` | integer | ID |  | ✓ |  |
| `is_warranty` | boolean | É garantia |  |  |  |
| `kanban_state` | selection (3 opções) | Kanban State | ✓ |  |  |
| `maintenance_duration` | float | Tempo Estimado |  |  |  |
| `maintenance_type` | selection (8 opções) | Tipo de Manutenção | ✓ |  |  |
| `message_attachment_count` | integer | Attachment Count |  | ✓ |  |
| `message_follower_ids` | one2many | Followers |  |  | mail.followers |
| `message_has_error` | boolean | Message Delivery error |  | ✓ |  |
| `message_has_error_counter` | integer | Number of errors |  | ✓ |  |
| `message_has_sms_error` | boolean | SMS Delivery error |  | ✓ |  |
| `message_ids` | one2many | Messages |  |  | mail.message |
| `message_is_follower` | boolean | Is Follower |  | ✓ |  |
| `message_main_attachment_id` | many2one | Main Attachment |  |  | ir.attachment |
| `message_needaction` | boolean | Action Needed |  | ✓ |  |
| `message_needaction_counter` | integer | Number of Actions |  | ✓ |  |
| `message_partner_ids` | many2many | Followers (Partners) |  |  | res.partner |
| `my_activity_date_deadline` | date | My Activity Deadline |  | ✓ |  |
| `name` | char | OS. N | ✓ | ✓ |  |
| `origin` | char | Source Document |  | ✓ |  |
| `periodicity_ids` | many2many | Periodicidade |  |  | engc.maintenance_plan.periodicity |
| `priority` | selection (4 opções) | Prioridade |  |  |  |
| `problem_description` | text | Descrição do chamado |  |  |  |
| `relatorios_count` | integer | Relatorios Count |  | ✓ |  |
| `relatorios_id` | one2many | Relatórios |  |  | engc.os.relatorios |
| `repaired` | boolean | Concluído |  | ✓ |  |
| `request_id` | many2one | Solicitação Ref. |  |  | engc.request.service |
| `request_parts` | one2many | Request Parts |  |  | engc.os.request.parts |
| `request_parts_count` | integer | Request Parts Count |  | ✓ |  |
| `request_service_id` | many2one | Request Service |  |  | engc.request.service |
| `sequence` | integer | Sequence |  |  |  |
| `service_description` | text | Descrição do Serviço |  |  |  |
| `signature` | binary | Signature |  |  |  |
| `signature2` | binary | Signature2 |  |  |  |
| `solicitante` | char | Solicitante | ✓ |  |  |
| `state` | selection (11 opções) | Status |  |  |  |
| `tecnico_id` | many2one | Técnico |  |  | hr.employee |
| `warranty_type` | selection (2 opções) | Tipo de Garantia |  |  |  |
| `website_message_ids` | one2many | Website Messages |  |  | mail.message |
| `who_executor` | selection (2 opções) | Manutenção | ✓ |  |  |
| `write_date` | datetime | Last Updated on |  | ✓ |  |
| `write_uid` | many2one | Last Updated by |  | ✓ | res.users |

## Amostra (até 3 registros)

```json
[]
```