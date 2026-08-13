# Bedrijfsgestuurde modelrouter op Vercel AI Gateway

Dit is geen gateway die alleen verkeer over meerdere providers verdeelt. De applicatie bepaalt eerst **wat voor verzoek binnenkomt**, welke data en modality het bevat, hoe risicovol en complex het is en welk kwaliteitsniveau minimaal nodig is. Daarna pas voert Vercel AI Gateway de gekozen route uit.

De kern:

1. valideer prompt en echte image-input;
2. blokkeer niet-toegestane dataklassen;
3. detecteer risico, tools en prompt-injectiesignalen;
4. routeer duidelijke verzoeken lokaal zonder extra modelcall;
5. gebruik Nemotron Nano alleen als goedkope classifier bij twijfel;
6. kies een stabiele bedrijfsalias, niet rechtstreeks een vendor-ID;
7. pas een kostenlimiet toe zonder onder de policy floor te zakken;
8. laat Vercel authenticatie, providerkeuze, tags en fallbacks verzorgen;
9. meet routekwaliteit en antwoordkwaliteit afzonderlijk.

Tekst en beeld hebben aparte routes. Nemotron 3 Nano en Super zijn text-only. Bij echte image-content kiest de router onder meer Gemini 3.5 Flash-Lite/Flash of een multimodaal frontiermodel. Een door de aanroeper gezet `vision: true` is niet genoeg; de payload moet werkelijk geldige afbeeldingcontent bevatten.

De modelkeuze is onderbouwd met:

- de actuele [Vercel AI Gateway-modelcatalogus](https://ai-gateway.vercel.sh/v1/models) voor beschikbaarheid, modalities en Gateway-prijs;
- [Artificial Analysis](https://artificialanalysis.ai/models) voor onafhankelijke indicaties van kwaliteit, snelheid, latency en verbosity;
- een eigen evaluatieset voor de werkelijke taken en beleidsregels.

Een benchmarkscore is geen productieacceptatie. Reasoning-effort, provider, promptvorm en interne taakverdeling kunnen sterk afwijken. Daarom staan modellen achter aliassen en moet elke wijziging opnieuw door de evaluaties.

## Starten

```powershell
npm ci --ignore-scripts
Copy-Item .env.example .env.local
npm test
npm run eval:routing
npm run costs
npm run dev
```

Standaard staat `ROUTER_DRY_RUN=true`. Er vindt dan geen modelgeneratie plaats. Voor lokale generatie is een `AI_GATEWAY_API_KEY` nodig; op Vercel kan OIDC worden gebruikt. Interne en restricted data staan standaard uit.

## Voor een organisatie van 100+ mensen

De meegeleverde 150-persoonsberekening komt met voorbeeldvolumes uit op ongeveer $101,63 modelkosten per maand en $137,19 met buffer. Dit is nadrukkelijk geen begroting. De echte uitkomst hangt vooral af van verzoekvolume, input- en outputtokens, reasoning, afbeeldingen, toolcalls, retries, fallbacks en rapportagegebruik.

De juiste route is:

- eerst twee weken shadow routing;
- per use case route- en kwaliteitsmetingen;
- afzonderlijke sleutels en budgetten voor fast/capable/frontier;
- waarschuwingen op 70 en 85 procent;
- een harde cap of expliciete degrade-strategie op 100 procent;
- premium alleen na aantoonbare meerwaarde en goedkeuring.

## Gebruik in Codex of Claude

De repo bevat een lokale MCP-adapter. Daarmee kan een bestaande Codex- of Claude Code-sessie `route_request` en `route_and_generate` gebruiken voor afgebakende deeltaken. Dit vervangt niet stiekem het basismodel van die coding agent. Zie [de integratiehandleiding](docs/codex-claude-integration.md).

## Belangrijkste documentatie

- [Architectuur](docs/architecture.md)
- [Onderbouwing modelkeuze](docs/model-selection.md)
- [Kostensturing](docs/cost-governance.md)
- [Security en data](docs/security-and-data.md)
- [Vercel-deployment](docs/deployment.md)
- [Evaluatie en uitrol](docs/evaluation-and-rollout.md)
- [Geavanceerde prompts](docs/prompt-cookbook.md)
- [NVIDIA Switchyard](docs/switchyard-watch.md)
- [Bronnenregister](docs/source-ledger.md)
