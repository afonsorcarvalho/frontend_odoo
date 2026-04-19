# afr.supervisorio.cycle.materials.lines

Gerado em: 2026-04-18T11:06:10.316Z
Servidor: mb.fitadigital.com.br / mb-odoo
Total de registros: 489

## Campos (18)

| Campo | Tipo | Label | Obrig. | RO | Relation |
|-------|------|-------|--------|----|----------|
| `__last_update` | datetime | Last Modified on |  | ✓ |  |
| `active` | boolean | Ativo |  |  |  |
| `ciclo_id` | many2one | Ciclo | ✓ |  | afr.supervisorio.ciclos |
| `ciclo_nome` | char | Nome do Ciclo |  | ✓ |  |
| `create_date` | datetime | Created on |  | ✓ |  |
| `create_uid` | many2one | Created by |  | ✓ | res.users |
| `display_name` | char | Display Name |  | ✓ |  |
| `fabricante_id` | many2one | Fabricante |  |  | res.partner |
| `fabricante_nome` | char | Nome do Fabricante |  | ✓ |  |
| `id` | integer | ID |  | ✓ |  |
| `lote` | char | Lote |  |  |  |
| `material_descricao` | char | Descrição do Material |  | ✓ |  |
| `material_id` | many2one | Material | ✓ |  | afr.supervisorio.materials |
| `quantidade` | float | Quantidade | ✓ |  |  |
| `unidade` | selection (6 opções) | Unidade | ✓ |  |  |
| `validade` | date | Validade |  |  |  |
| `write_date` | datetime | Last Updated on |  | ✓ |  |
| `write_uid` | many2one | Last Updated by |  | ✓ | res.users |

## Amostra (até 3 registros)

```json
[
  {
    "id": 498,
    "__last_update": "2026-04-17 15:04:46",
    "active": true,
    "ciclo_id": [
      184,
      "201140426_20260414_150444"
    ],
    "ciclo_nome": "201140426_20260414_150444",
    "create_date": "2026-04-17 15:04:46",
    "create_uid": [
      7,
      "Elaine Cristina"
    ],
    "display_name": "POLIKIT 1000ML SEM DRENO - 63.0 unidade (Lote: PKD09042026)",
    "fabricante_id": [
      17,
      "POLIPLAST INDUSTRIA COMERCIO E SERVICOS PLASTICOS EIRELI ME"
    ],
    "fabricante_nome": "POLIPLAST INDUSTRIA COMERCIO E SERVICOS PLASTICOS EIRELI ME",
    "lote": "PKD09042026",
    "material_descricao": "POLIKIT 1000ML SEM DRENO",
    "material_id": [
      99,
      "POLIKIT 1000ML SEM DRENO (POLIPLAST INDUSTRIA COMERCIO E SERVICOS PLASTICOS EIRELI ME)"
    ],
    "quantidade": 63,
    "unidade": "unidade",
    "validade": false,
    "write_date": "2026-04-17 15:04:46",
    "write_uid": [
      7,
      "Elaine Cristina"
    ]
  },
  {
    "id": 497,
    "__last_update": "2026-04-17 15:04:46",
    "active": true,
    "ciclo_id": [
      184,
      "201140426_20260414_150444"
    ],
    "ciclo_nome": "201140426_20260414_150444",
    "create_date": "2026-04-17 15:04:46",
    "create_uid": [
      7,
      "Elaine Cristina"
    ],
    "display_name": "BIO KIT 2000ML - 92.0 unidade (Lote: BK140426)",
    "fabricante_id": [
      1,
      "MB Indústria Cirúrgica"
    ],
    "fabricante_nome": "MB Indústria Cirúrgica",
    "lote": "BK140426",
    "material_descricao": "BIO KIT 2000ML",
    "material_id": [
      12,
      "BIO KIT 2000ML (MB Indústria Cirúrgica)"
    ],
    "quantidade": 92,
    "unidade": "unidade",
    "validade": "2029-04-14",
    "write_date": "2026-04-17 15:04:46",
    "write_uid": [
      7,
      "Elaine Cristina"
    ]
  },
  {
    "id": 496,
    "__last_update": "2026-04-17 15:04:46",
    "active": true,
    "ciclo_id": [
      184,
      "201140426_20260414_150444"
    ],
    "ciclo_nome": "201140426_20260414_150444",
    "create_date": "2026-04-17 15:04:46",
    "create_uid": [
      7,
      "Elaine Cristina"
    ],
    "display_name": "BIO KIT 1000ML - 132.0 unidade (Lote: BK140426)",
    "fabricante_id": [
      1,
      "MB Indústria Cirúrgica"
    ],
    "fabricante_nome": "MB Indústria Cirúrgica",
    "lote": "BK140426",
    "material_descricao": "BIO KIT 1000ML",
    "material_id": [
      17,
      "BIO KIT 1000ML (MB Indústria Cirúrgica)"
    ],
    "quantidade": 132,
    "unidade": "unidade",
    "validade": "2029-04-14",
    "write_date": "2026-04-17 15:04:46",
    "write_uid": [
      7,
      "Elaine Cristina"
    ]
  }
]
```