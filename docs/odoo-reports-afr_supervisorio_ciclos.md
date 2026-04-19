# Odoo Reports (afr.supervisorio.ciclos)

Gerado em: 2026-04-18T09:53:15.706Z
Servidor: mb.fitadigital.com.br / mb-odoo
Total: 2

## URLs de download (Odoo 16)

```
# PDF direto (padrão)
GET /report/pdf/<report_name>/<doc_ids>

# PDF com nome customizado
GET /report/download?data=<json>
    onde json = [fullUrl, "qweb-pdf"]
```

## Reports disponíveis

| Model | report_name | Nome | Tipo | Binding |
|-------|-------------|------|------|---------|
| `afr.supervisorio.ciclos` | `afr_supervisorio_ciclos.report_ciclos_template` | Impressão de CICLOS | qweb-pdf | report |
| `afr.supervisorio.ciclos` | `afr_supervisorio_ciclos_extras.report_laudo_liberacao_template` | Laudo de Liberação de Produtos | qweb-pdf | report |

## Detalhes completos

```json
[
  {
    "id": 380,
    "name": "Impressão de CICLOS",
    "report_name": "afr_supervisorio_ciclos.report_ciclos_template",
    "report_type": "qweb-pdf",
    "model": "afr.supervisorio.ciclos",
    "binding_model_id": [
      606,
      "Supervisório de Ciclos de Esterilização, Lavagem e Desinfecção"
    ],
    "binding_type": "report",
    "print_report_name": "'Ciclo %s' % (object.name)",
    "paperformat_id": false,
    "attachment": false,
    "attachment_use": false,
    "xml_id": "afr_supervisorio_ciclos.report_steril_supervisorio_ciclos_action"
  },
  {
    "id": 385,
    "name": "Laudo de Liberação de Produtos",
    "report_name": "afr_supervisorio_ciclos_extras.report_laudo_liberacao_template",
    "report_type": "qweb-pdf",
    "model": "afr.supervisorio.ciclos",
    "binding_model_id": false,
    "binding_type": "report",
    "print_report_name": "'Laudo_Liberacao_%s' % (object.name)",
    "paperformat_id": [
      1,
      "A4"
    ],
    "attachment": false,
    "attachment_use": false,
    "xml_id": "afr_supervisorio_ciclos_extras.report_laudo_liberacao_action"
  }
]
```