## MODIFIED Requirements

### Requirement: Ciclo de vida de la sonda decimal
Las garantías equivalentes a la sonda decimal MUST residir en pruebas
permanentes que verifiquen la configuración decimal, los empates `1.005`,
`-1.005` y `0.625`, y la ida y vuelta JSON observable. El archivo
`scripts/verify-decimal.mjs` MUST dejar de existir y MUST carecer de referencias
ejecutables o ignores activos.

#### Scenario: Garantías trasladadas a la suite permanente
- **WHEN** se ejecuta la suite permanente de dominio
- **THEN** las pruebas verifican la configuración decimal, los tres empates y
  la ida y vuelta JSON que cubría la sonda

#### Scenario: Retiro completo de la sonda
- **WHEN** se inspeccionan los scripts y la configuración ejecutable del
  repositorio
- **THEN** `scripts/verify-decimal.mjs` no existe ni permanece referenciado o
  excluido mediante un ignore activo
