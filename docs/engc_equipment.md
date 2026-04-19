# engc.equipment

Gerado em: 2026-04-19T09:50:17.457Z
Servidor: vps46593.publiccloud.com.br / odoo-steriliza-teste
Total de registros: 28

## Campos (75)

| Campo | Tipo | Label | Obrig. | RO | Relation |
|-------|------|-------|--------|----|----------|
| `__last_update` | datetime | Last Modified on |  | ✓ |  |
| `acquisition_date` | date | Date de Aquisição |  |  |  |
| `activity_calendar_event_id` | many2one | Next Activity Calendar Event |  | ✓ | calendar.event |
| `activity_date_deadline` | date | Next Activity Deadline |  | ✓ |  |
| `activity_exception_decoration` | selection (2 opções) | Activity Exception Decoration |  | ✓ |  |
| `activity_exception_icon` | char | Icon |  | ✓ |  |
| `activity_ids` | one2many | Activities |  |  | mail.activity |
| `activity_state` | selection (3 opções) | Activity State |  | ✓ |  |
| `activity_summary` | char | Next Activity Summary |  |  |  |
| `activity_type_icon` | char | Activity Type Icon |  | ✓ |  |
| `activity_type_id` | many2one | Next Activity Type |  |  | mail.activity.type |
| `activity_user_id` | many2one | Responsible User |  |  | res.users |
| `anvisa_code` | char | Reg Anvisa |  |  |  |
| `apelido` | char | apelido |  |  |  |
| `calibrations_ids` | one2many | Calibrações |  |  | engc.calibration |
| `category_id` | many2one | Categoria | ✓ |  | engc.equipment.category |
| `chamber_size` | float | Volume Câmara (L) |  |  |  |
| `child_ids` | one2many | Componentes |  |  | engc.equipment |
| `client_id` | many2one | Cliente |  |  | res.partner |
| `color` | char | Color |  |  |  |
| `company_id` | many2one | Instituição | ✓ |  | res.company |
| `create_date` | datetime | Created on |  | ✓ |  |
| `create_uid` | many2one | Created by |  | ✓ | res.users |
| `cycle_model` | many2one | Modelo de ciclo |  |  | steril_supervisorio.cycle_model |
| `cycle_path` | char | Diretorio do ciclo |  |  |  |
| `cycle_type_id` | many2one | Tipo de ciclo |  |  | afr.cycle.type |
| `department` | many2one | Departamento |  |  | hr.department |
| `display_name` | char | Display Name |  | ✓ |  |
| `duration` | float | Duração da Manutenção |  |  |  |
| `extended_warranty` | date | Garantia Extendida |  |  |  |
| `has_message` | boolean | Has Message |  | ✓ |  |
| `id` | integer | ID |  | ✓ |  |
| `image_1920` | binary | avatar |  |  |  |
| `instalation_date` | date | Date de Instalação |  |  |  |
| `invoice_document` | binary | Nota Fiscal |  |  |  |
| `location_id` | many2one | Local de Uso | ✓ |  | engc.equipment.location |
| `maintenance_plan` | many2one | Plano de manutenção |  |  | engc.maintenance_plan |
| `maintenance_team_id` | many2one | Equipe de Manutenção |  |  | engc.equipment.maintenance.team |
| `manufacturing_date` | date | Data de Fabricação |  |  |  |
| `marca_id` | many2one | Marca | ✓ |  | engc.equipment.marca |
| `means_of_aquisition_id` | many2one | Meio de Aquisição | ✓ |  | engc.equipment.means.of.aquisition |
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
| `model` | char | Modelo | ✓ |  |  |
| `my_activity_date_deadline` | date | My Activity Deadline |  | ✓ |  |
| `name` | char | Name |  | ✓ |  |
| `next_maintenance` | date | Próxima Manutenção Preventiva |  |  |  |
| `note` | text | Note |  |  |  |
| `oses` | one2many | Ordens de serviço |  |  | engc.os |
| `parent_id` | many2one | Equipamento pai |  |  | engc.equipment |
| `parent_left` | integer | Left Parent |  |  |  |
| `parent_path` | char | Parent Path |  |  |  |
| `parent_right` | integer | Right Parent |  |  |  |
| `partner_reference` | char | Referência de Fornecedor |  |  |  |
| `patrimony` | char | Patrimonio |  |  |  |
| `period` | integer | Frequência de Manutenção |  |  |  |
| `picture_ids` | one2many | fotos |  |  | engc.equipment.pictures |
| `serial_number` | char | Número de Série | ✓ |  |  |
| `state` | selection (3 opções) | Status | ✓ |  |  |
| `stop_history_ids` | one2many | Stop History |  |  | engc.equipment.stop.history |
| `tag` | char | Tag |  |  |  |
| `technician_id` | many2one | Técnico |  |  | hr.employee |
| `warranty` | date | Garantia |  |  |  |
| `website_message_ids` | one2many | Website Messages |  |  | mail.message |
| `write_date` | datetime | Last Updated on |  | ✓ |  |
| `write_uid` | many2one | Last Updated by |  | ✓ | res.users |

## Amostra (até 3 registros)

```json
[
  {
    "id": 56,
    "__last_update": "2025-11-29 21:01:08",
    "acquisition_date": false,
    "activity_calendar_event_id": false,
    "activity_date_deadline": false,
    "activity_exception_decoration": false,
    "activity_exception_icon": false,
    "activity_ids": [],
    "activity_state": false,
    "activity_summary": false,
    "activity_type_icon": false,
    "activity_type_id": false,
    "activity_user_id": false,
    "anvisa_code": false,
    "apelido": "US01",
    "calibrations_ids": [],
    "category_id": [
      12,
      "ULTRASONICA"
    ],
    "chamber_size": 0,
    "child_ids": [],
    "client_id": false,
    "color": false,
    "company_id": [
      2,
      "AFR - Fortaleza"
    ],
    "create_date": "2025-11-29 21:01:08",
    "create_uid": [
      2,
      "Administrator"
    ],
    "cycle_model": false,
    "cycle_path": false,
    "cycle_type_id": false,
    "department": [
      9,
      "Produção / Esterilização"
    ],
    "display_name": "ULTRASONICA Sonic Irrigator SA 03200122102 MED SAFE",
    "duration": 0,
    "extended_warranty": false,
    "has_message": true,
    "instalation_date": false,
    "location_id": [
      8,
      "EXPURGO"
    ],
    "maintenance_plan": false,
    "maintenance_team_id": false,
    "manufacturing_date": false,
    "marca_id": [
      8,
      "MED SAFE"
    ],
    "means_of_aquisition_id": [
      5,
      "COMPRA"
    ],
    "message_attachment_count": 0
  },
  {
    "id": 55,
    "__last_update": "2025-11-27 20:10:58",
    "acquisition_date": false,
    "activity_calendar_event_id": false,
    "activity_date_deadline": false,
    "activity_exception_decoration": false,
    "activity_exception_icon": false,
    "activity_ids": [],
    "activity_state": false,
    "activity_summary": false,
    "activity_type_icon": false,
    "activity_type_id": false,
    "activity_user_id": false,
    "anvisa_code": false,
    "apelido": "OR04",
    "calibrations_ids": [],
    "category_id": [
      10,
      "OSMOSE REVERSA"
    ],
    "chamber_size": 0,
    "child_ids": [],
    "client_id": false,
    "color": false,
    "company_id": [
      2,
      "AFR - Fortaleza"
    ],
    "create_date": "2025-11-27 20:08:52",
    "create_uid": [
      2,
      "Administrator"
    ],
    "cycle_model": false,
    "cycle_path": false,
    "cycle_type_id": false,
    "department": [
      9,
      "Produção / Esterilização"
    ],
    "display_name": "OSMOSE REVERSA H0100-060 2519.19.3830 BAUMER",
    "duration": 0,
    "extended_warranty": false,
    "has_message": true,
    "instalation_date": "2025-09-01",
    "location_id": [
      8,
      "EXPURGO"
    ],
    "maintenance_plan": false,
    "maintenance_team_id": false,
    "manufacturing_date": "2025-05-01",
    "marca_id": [
      1,
      "BAUMER"
    ],
    "means_of_aquisition_id": [
      5,
      "COMPRA"
    ],
    "message_attachment_count": 0
  },
  {
    "id": 54,
    "__last_update": "2025-11-26 17:37:43",
    "acquisition_date": false,
    "activity_calendar_event_id": false,
    "activity_date_deadline": false,
    "activity_exception_decoration": false,
    "activity_exception_icon": false,
    "activity_ids": [],
    "activity_state": false,
    "activity_summary": false,
    "activity_type_icon": false,
    "activity_type_id": false,
    "activity_user_id": false,
    "anvisa_code": false,
    "apelido": "COMPRESSOR01",
    "calibrations_ids": [],
    "category_id": [
      15,
      "COMPRESSORES"
    ],
    "chamber_size": 0,
    "child_ids": [],
    "client_id": false,
    "color": false,
    "company_id": [
      2,
      "AFR - Fortaleza"
    ],
    "create_date": "2025-11-26 17:37:43",
    "create_uid": [
      2,
      "Administrator"
    ],
    "cycle_model": false,
    "cycle_path": false,
    "cycle_type_id": false,
    "department": [
      9,
      "Produção / Esterilização"
    ],
    "display_name": "COMPRESSORES CSV 20 ISENT 0004233711 SCHULZ",
    "duration": 0,
    "extended_warranty": false,
    "has_message": true,
    "instalation_date": false,
    "location_id": [
      12,
      "UTILIDADES"
    ],
    "maintenance_plan": false,
    "maintenance_team_id": false,
    "manufacturing_date": "2024-02-01",
    "marca_id": [
      11,
      "SCHULZ"
    ],
    "means_of_aquisition_id": [
      5,
      "COMPRA"
    ],
    "message_attachment_count": 0
  }
]
```