# HEALTH360 — CONTEXTO DA APLICAÇÃO, FUNCIONALIDADES E FLUXOS DO MVP

(Prompt original do usuário, transcrito na íntegra. Representa trabalho FUTURO: deve ser registrado no repositório como contexto e backlog, não implementado nesta etapa. O escopo é definido em 00-orchestrator-brief.md.)

## 1. Visão geral do Health360

O Health360 é uma healthtech brasileira que está desenvolvendo uma plataforma de inteligência clínica voltada à medicina preventiva personalizada, contínua e baseada em evidências científicas.

A proposta é transformar os check-ups tradicionais, frequentemente organizados em pacotes padronizados de exames, em um processo de prevenção individualizado e acompanhado ao longo do tempo.

O Health360 busca ajudar médicos e pacientes a compreender:

- Quais oportunidades preventivas são relevantes para cada pessoa.
- Quais avaliações devem ser consideradas.
- Quais exames podem ser redundantes ou desnecessários.
- Quais informações precisam ser esclarecidas.
- Quais ações devem ser acompanhadas.
- Como o plano preventivo deve evoluir ao longo do tempo.

O princípio central do produto é:

"Better decisions, not more tests."

A plataforma combina anamnese estruturada, histórico clínico, inteligência artificial, evidências científicas, revisão médica e acompanhamento longitudinal.

O Health360 não pretende substituir o médico. A inteligência artificial funciona como uma ferramenta de apoio, enquanto as decisões clínicas permanecem sob responsabilidade do profissional.

---

# 2. Objetivo do MVP

Construir uma aplicação web funcional que demonstre o ciclo principal do Health360.

O MVP será desenvolvido em um prazo reduzido e apresentado no contexto da competição internacional HISIC 2026.

O projeto ainda não possui funcionalidades desenvolvidas nem validação clínica.

Portanto, o protótipo deverá funcionar inicialmente com dados sintéticos, pacientes fictícios e cenários demonstrativos.

O objetivo é comprovar a viabilidade técnica e apresentar a experiência idealizada, não demonstrar eficácia clínica.

O fluxo completo será:

Paciente preenche histórico → Sistema organiza informações → IA analisa o contexto fornecido → IA prepara propostas para revisão → Médico avalia e toma decisões → Paciente recebe o plano revisado → Sistema preserva o histórico → Novos dados permitem uma reavaliação.

Todas as etapas principais devem funcionar de ponta a ponta.

Evitar funcionalidades apenas visuais que não produzam efeitos reais na aplicação.

---

# 3. Estratégia de inteligência artificial — IMPORTANTE

O Health360 NÃO desenvolverá uma inteligência artificial proprietária neste MVP.

Não criar, treinar, ajustar ou hospedar modelos próprios.

Não implementar pipelines de machine learning, modelos preditivos proprietários, sistemas multiagentes, Knowledge Graphs ou mecanismos sofisticados de otimização.

A plataforma utilizará um modelo de linguagem consolidado, como um modelo GPT, acessado por API.

O modelo específico deverá ser configurável, permitindo substituição sem alterações significativas na aplicação.

A inteligência da solução estará na combinação entre:

1. Informações estruturadas do paciente.
2. Contexto clínico previamente preparado.
3. Evidências científicas selecionadas.
4. Instruções específicas de comportamento.
5. Regras explícitas e limites de atuação.
6. Respostas estruturadas do modelo.
7. Supervisão médica obrigatória.

## 3.1. Funcionamento da integração

O backend deverá preparar as informações que serão enviadas ao modelo.

A requisição poderá conter:

### Instruções do sistema

Definem:

- O papel da IA como assistente de apoio clínico.
- Suas responsabilidades.
- Os limites das análises.
- O comportamento diante de informações insuficientes.
- A obrigação de reconhecer incertezas.
- A proibição de inventar informações clínicas.
- A necessidade de utilizar apenas as evidências fornecidas para fundamentar propostas.

### Contexto clínico

Um conjunto reduzido de documentos e informações selecionados pela equipe médica, contendo:

- Diretrizes clínicas pertinentes ao escopo.
- Critérios preventivos.
- Informações sobre indicações e contraindicações.
- Critérios de elegibilidade.
- Situações de possível redundância.
- Limitações e incertezas.

Esse contexto deverá ser organizado de maneira versionada e rastreável.

Para o MVP, não será necessário criar um sistema RAG completo ou banco vetorial.

O contexto poderá ser mantido em arquivos estruturados ou registros simples, carregados pelo backend conforme o cenário.

### Dados do paciente

Informações coletadas pela anamnese:

- Idade.
- Informações clinicamente relevantes.
- Histórico pessoal.
- Histórico familiar.
- Medicamentos.
- Hábitos.
- Exames anteriores.
- Informações ausentes.

Enviar somente os dados necessários para cada análise.

### Contrato de resposta

A IA deverá retornar uma estrutura padronizada contendo:

- Resumo do caso.
- Informações relevantes identificadas.
- Informações ausentes.
- Possíveis oportunidades preventivas.
- Possíveis exames redundantes.
- Justificativas baseadas no contexto fornecido.
- Referências às evidências disponibilizadas.
- Incertezas e limitações.
- Questões para revisão médica.

Utilizar Structured Outputs ou mecanismo equivalente, com validação do schema no backend.

---

# 4. Regras e segurança da IA

O modelo poderá auxiliar na interpretação e organização das informações, mas não terá autonomia para autorizar decisões médicas.

Não confiar exclusivamente em instruções textuais para impor restrições clínicas.

Implementar uma camada simples de validação no backend, responsável por:

- Validar o formato da resposta.
- Verificar identificadores de evidências.
- Impedir referências inexistentes.
- Rejeitar categorias não permitidas.
- Detectar ausência de informações obrigatórias.
- Bloquear publicação automática de propostas.
- Tratar respostas inválidas ou falhas da API.
- Garantir revisão médica antes da disponibilização do plano.

Para o protótipo, utilizar apenas cenários clínicos restritos e previamente definidos.

O comportamento esperado dos cenários deverá ser documentado e testado.

O LLM não deverá ter permissão para ampliar autonomamente o escopo clínico ou transformar suas próprias conclusões em recomendações finais.

As regras críticas de elegibilidade, contraindicação e bloqueio deverão ser controladas pela aplicação, ainda que de maneira simples, e não apenas pelo prompt.

As evidências e regras inicialmente utilizadas serão demonstrativas até passarem por revisão médica formal.

O sistema deverá reconhecer quando não dispõe de informações suficientes.

---

# 5. Usuários da aplicação

O MVP terá dois ambientes integrados.

## 5.1. Paciente

O paciente utiliza a plataforma para fornecer suas informações, acompanhar sua avaliação e visualizar seu plano preventivo.

Funcionalidades:

- Acessar o ambiente do paciente.
- Iniciar ou continuar uma anamnese.
- Informar histórico pessoal e familiar.
- Registrar medicamentos e hábitos.
- Informar exames anteriores.
- Revisar e editar respostas.
- Enviar as informações para análise.
- Visualizar o status do processo.
- Responder a perguntas complementares.
- Consultar o plano após revisão médica.
- Acompanhar seu histórico longitudinal.
- Atualizar informações relevantes.

A experiência deve ser simples, intuitiva e mobile-first.

## 5.2. Médico

O médico acessa um workspace profissional para revisar as propostas preparadas pelo sistema.

Funcionalidades:

- Visualizar pacientes aguardando revisão.
- Consultar perfis clínicos.
- Ler resumos estruturados pela IA.
- Analisar propostas preventivas.
- Consultar justificativas e evidências.
- Identificar possíveis redundâncias.
- Visualizar informações insuficientes.
- Aprovar, modificar ou rejeitar propostas.
- Solicitar esclarecimentos.
- Registrar justificativas.
- Finalizar revisões.
- Consultar histórico de decisões.

A experiência médica deverá priorizar desktop, clareza, rastreabilidade e produtividade.

---

# 6. Módulo 1 — Ambiente demonstrativo

Implementar um ambiente de demonstração com pacientes fictícios.

O MVP deverá conter pelo menos um cenário completo, previamente preparado, que possa ser apresentado rapidamente aos jurados.

Funcionalidades:

- Selecionar paciente demonstrativo.
- Alternar entre visualização do paciente e do médico.
- Manter os dados compartilhados entre os ambientes.
- Persistir alterações e decisões.
- Reiniciar a demonstração.
- Identificar claramente o ambiente como protótipo.

Não implementar autenticação complexa inicialmente.

A alternância de papéis será exclusiva do ambiente demonstrativo, sem representar autorização válida para uso clínico real.

---

# 7. Módulo 2 — Smart Health Intake

Implementar uma anamnese guiada, dividida em etapas.

## Etapa 1 — Informações básicas

Coletar apenas os dados necessários aos cenários demonstrativos.

## Etapa 2 — Histórico clínico

- Condições prévias.
- Histórico familiar.
- Medicamentos em uso.

## Etapa 3 — Hábitos

- Tabagismo.
- Atividade física.
- Outros hábitos relevantes ao cenário.

## Etapa 4 — Exames anteriores

- Tipo de exame.
- Data.
- Resultado demonstrativo.
- Observações.

## Etapa 5 — Revisão das respostas

O paciente poderá revisar, corrigir e confirmar as informações.

Após a conclusão:

1. Os dados são salvos.
2. O perfil clínico é atualizado.
3. A análise pode ser iniciada.
4. O status do paciente é atualizado.

Requisitos de UX:

- Indicador de progresso.
- Navegação de voltar e avançar.
- Salvamento de respostas.
- Perguntas condicionais.
- Validação.
- Respostas como "Não sei".
- Formulário responsivo.
- Linguagem clara.

Não criar uma anamnese extensa ou excessivamente complexa.

---

# 8. Módulo 3 — Clinical Profile

Implementar uma visualização consolidada do histórico clínico.

O perfil deverá conter:

- Informações básicas.
- Histórico pessoal.
- Histórico familiar.
- Medicamentos.
- Hábitos.
- Exames anteriores.
- Informações ausentes.
- Data da última atualização.

O perfil será compartilhado entre os fluxos de paciente, análise por IA e revisão médica.

Identificar claramente informações declaradas, estruturadas e desconhecidas.

Não criar scores artificiais de saúde.

---

# 9. Módulo 4 — AI Clinical Analysis

Este é o principal módulo tecnológico do MVP.

Implementar a integração entre dados do paciente, contexto clínico e LLM consolidado.

## Fluxo de execução

1. O paciente conclui a anamnese.
2. O backend obtém seu perfil estruturado.
3. Seleciona o contexto clínico pertinente ao cenário.
4. Aplica os critérios e bloqueios determinísticos necessários.
5. Monta a requisição ao modelo de IA.
6. O modelo retorna uma análise estruturada.
7. O backend valida a resposta e suas referências.
8. As propostas são armazenadas.
9. O paciente passa ao estado de revisão médica pendente.
10. O médico pode consultar a análise.

## Responsabilidades da IA

- Criar resumo clínico estruturado.
- Identificar informações relevantes.
- Relacionar dados do paciente ao contexto fornecido.
- Explicar o significado das regras aplicáveis.
- Organizar possíveis oportunidades preventivas.
- Contextualizar possíveis redundâncias identificadas.
- Reconhecer informações ausentes.
- Registrar incertezas.
- Preparar explicações para o médico.

Não implementar análises clínicas ilimitadas ou consultas genéricas sobre qualquer doença.

O escopo do modelo será restrito às situações selecionadas para o MVP.

A saída será sempre preliminar e exigirá revisão humana.

---

# 10. Módulo 5 — Do Not Test Intelligence

Implementar como uma capacidade do fluxo de análise clínica.

Seu objetivo é demonstrar a identificação de possíveis exames redundantes ou desnecessários.

## Exemplo do fluxo

1. O paciente registra um exame anterior.
2. O sistema identifica o exame, sua data e as informações disponíveis.
3. Uma regra demonstrativa verifica uma possível redundância.
4. A IA recebe os resultados dessa verificação.
5. A IA organiza uma explicação contextualizada.
6. O médico visualiza a proposta.
7. O médico aceita, modifica ou rejeita a avaliação.
8. O resultado revisado é registrado.

O sistema deverá explicar:

- Qual avaliação foi analisada.
- Quais dados foram considerados.
- Qual critério foi aplicado.
- Por que a possível redundância foi identificada.
- Quais limitações existem.

Não presumir que todo exame recente seja desnecessário.

Nenhuma sinalização deverá ser convertida automaticamente em orientação médica ao paciente.

---

# 11. Módulo 6 — Intelligent Clarification

Implementar perguntas complementares simples.

Quando dados essenciais estiverem ausentes, o sistema poderá solicitar uma informação adicional.

A aplicação determinará quais campos precisam ser esclarecidos.

A IA poderá auxiliar na redação da pergunta, utilizando linguagem compreensível.

Exemplo:

"Você informou que realizou um exame anteriormente. Sabe aproximadamente em que período ele foi realizado?"

O paciente responde e a informação é salva.

Se necessário, a análise é executada novamente.

Não criar um chatbot conversacional completo.

Limitar perguntas ao escopo das regras demonstrativas.

Permitir que o paciente informe que não sabe responder.

---

# 12. Módulo 7 — Physician Review Workspace

Criar um ambiente médico com duas telas principais.

## Tela A — Fila de revisões

Apresentar:

- Paciente.
- Data da análise.
- Status.
- Ação para abrir.

## Tela B — Revisão clínica

O workspace será dividido em:

### Contexto do paciente

- Histórico clínico.
- Fatores relevantes.
- Medicamentos.
- Exames anteriores.
- Informações ausentes.

### Propostas da IA

Cada proposta deverá conter:

- Nome da ação.
- Categoria.
- Justificativa.
- Critérios considerados.
- Evidência vinculada.
- Incertezas.
- Status de revisão.

### Decisão médica

Permitir:

- Aprovar.
- Modificar.
- Rejeitar.
- Manter pendente.
- Solicitar informações complementares.

Exigir justificativa para modificações ou rejeições.

Registrar:

- Identificação do revisor demonstrativo.
- Data.
- Decisão.
- Justificativa.
- Versão da análise.

Permitir finalizar a revisão apenas quando as condições de conclusão forem atendidas.

Não representar ações de usuários fictícios como validação médica real.

---

# 13. Módulo 8 — Personalized Preventive Plan

Após a conclusão da revisão, gerar um plano preventivo compreensível.

O plano deverá apresentar:

- Resumo do acompanhamento.
- Ações selecionadas.
- Avaliações consideradas potencialmente redundantes e revisadas.
- Informações pendentes.
- Próximos passos.
- Estado das ações.

A visualização deve ser voltada ao paciente.

Evitar textos técnicos desnecessários e explicações complexas.

O conteúdo apresentado deverá corresponder às decisões registradas no workspace médico.

Não publicar propostas ainda não revisadas.

---

# 14. Módulo 9 — Longitudinal Health Twin

Implementar uma versão simplificada do histórico longitudinal.

O Health Twin do MVP não será um modelo preditivo ou uma representação biológica complexa.

Será uma estrutura que preserva informações e decisões ao longo do tempo.

Funcionalidades:

- Timeline de eventos.
- Histórico de avaliações.
- Histórico de decisões.
- Versões anteriores de planos.
- Alterações no perfil.
- Comparação básica entre ciclos.

## Fluxo de atualização

1. Paciente possui um plano anterior.
2. Atualiza uma informação.
3. A aplicação salva uma nova versão do perfil.
4. O contexto da nova análise é preparado.
5. A IA é utilizada novamente, dentro do escopo controlado.
6. Uma nova proposta é gerada.
7. O médico revisa.
8. Um novo plano pode ser publicado.
9. A versão anterior permanece disponível.

---

# 15. Fluxos obrigatórios de ponta a ponta

## Fluxo A — Primeira avaliação

Paciente → Anamnese → Perfil clínico → Análise por IA → Revisão médica → Plano preventivo.

## Fluxo B — Do Not Test

Exame anterior → Verificação de possível redundância → Explicação da IA → Revisão médica → Registro da decisão → Plano.

## Fluxo C — Esclarecimento

Informação ausente → Pergunta complementar → Resposta do paciente → Atualização do perfil → Nova análise.

## Fluxo D — Reavaliação

Plano anterior → Nova informação → Nova análise → Revisão médica → Nova versão do plano → Histórico preservado.

## Fluxo E — Falha da IA

Falha de API, resposta inválida ou evidência insuficiente → Análise bloqueada → Mensagem de erro apropriada → Possibilidade de nova tentativa → Nenhuma proposta publicada automaticamente.

---

# 16. Estados da aplicação

Implementar estados claros:

- NOT_STARTED
- INTAKE_IN_PROGRESS
- INTAKE_COMPLETED
- ANALYSIS_PENDING
- ANALYSIS_FAILED
- CLARIFICATION_REQUIRED
- MEDICAL_REVIEW_PENDING
- MEDICAL_REVIEW_IN_PROGRESS
- MEDICAL_REVIEW_COMPLETED
- PLAN_AVAILABLE
- REASSESSMENT_PENDING

Garantir consistência entre os estados do backend e a interface.

Não permitir acesso a planos não revisados como se estivessem concluídos.

---

# 17. Design e experiência

A identidade visual será Clinical Premium SaaS.

A aplicação deverá parecer um software profissional de saúde, não um projeto genérico gerado por IA.

Características:

- Minimalista.
- Moderna.
- Clara.
- Confiável.
- Consistente.
- Responsiva.
- Acessível.

O ambiente do paciente será mobile-first.

O ambiente do médico será desktop-first.

Utilizar design system com tokens centralizados para cores, tipografia, espaçamentos, bordas e estados.

Evitar:

- Chatbot como interface principal.
- Gradientes exagerados.
- Excesso de cards.
- Cores arbitrárias.
- Métricas inventadas.
- Componentes inconsistentes.
- Dashboards decorativos.
- Animações sem função.

A IA deverá aparecer integrada aos fluxos, sem dominar visualmente a aplicação.

Todos os textos da interface deverão estar em português brasileiro.

---

# 18. Persistência e dados

Persistir os dados necessários para o funcionamento dos fluxos.

Entidades principais:

- Patient.
- HealthProfile.
- IntakeResponse.
- PreviousExamination.
- ClinicalContext.
- AIAnalysis.
- RecommendationProposal.
- MedicalReview.
- PreventivePlan.
- TimelineEvent.

Registrar a versão do contexto clínico, o modelo utilizado e a versão das informações analisadas.

Preservar o histórico de análises e decisões.

Evitar armazenar raciocínios internos extensos do LLM; registrar somente entradas relevantes, referências, resultados estruturados e metadados necessários à rastreabilidade.

Todos os dados do protótipo deverão ser sintéticos.

---

# 19. O que NÃO implementar

Não desenvolver:

- IA própria.
- Treinamento ou fine-tuning de modelos.
- Modelos preditivos proprietários.
- Knowledge Graph.
- Infraestrutura de machine learning.
- Orquestração multiagente.
- Sistemas RAG complexos.
- Bancos vetoriais sem necessidade.
- Aplicativo mobile nativo.
- Integrações reais com laboratórios.
- Integrações com hospitais.
- Telemedicina.
- Pagamentos.
- Agendamentos.
- OCR de exames.
- Chatbot médico aberto.
- Marketplace.
- Dashboards empresariais.
- Recursos de wearable.
- Funcionalidades clínicas para pacientes reais.

Esses recursos poderão ser avaliados em fases posteriores.

---

# 20. Prioridades do MVP

## P0 — Obrigatório

- Ambiente demonstrativo.
- Anamnese estruturada.
- Perfil clínico.
- Integração via API com LLM consolidado.
- Contexto clínico estruturado e versionado.
- Validação de respostas.
- Análise clínica preliminar assistida por IA.
- Identificação demonstrativa de possíveis redundâncias.
- Workspace médico.
- Revisão de propostas.
- Plano preventivo.
- Histórico longitudinal básico.
- Persistência.
- Estados de erro e pendência.

## P1 — Se houver tempo

- Perguntas complementares formuladas com apoio de IA.
- Comparação de versões do plano.
- Resumos automatizados de mudanças.
- Melhorias adicionais na demonstração.

## P2 — Futuro

Funcionalidades comerciais, integrações externas e inteligência clínica avançada.

---

# 21. Critérios de aceite do MVP

O protótipo estará pronto quando for possível demonstrar:

1. Um paciente fictício inicia sua avaliação.
2. Preenche uma anamnese.
3. As informações são persistidas.
4. O backend prepara o contexto para o LLM.
5. A integração real com a API executa a análise.
6. A resposta estruturada é validada.
7. O sistema apresenta propostas preliminares.
8. Uma possível redundância é identificada.
9. Uma informação insuficiente é reconhecida.
10. O médico acessa o workspace.
11. Consulta evidências e justificativas.
12. Aprova, modifica ou rejeita propostas.
13. Finaliza a revisão.
14. O paciente visualiza o plano demonstrativo.
15. Atualiza uma informação.
16. Uma nova análise é executada.
17. O histórico anterior é preservado.
18. A demonstração pode ser reiniciada.

Os casos apresentados devem ser sintéticos, com resultados esperados previamente definidos e testados.

O uso de um LLM consolidado não significa que suas propostas tenham sido clinicamente validadas.

---

# 22. Resultado esperado

Construir um MVP web funcional, com interface profissional, duas experiências integradas e uma inteligência artificial consolidada atuando como assistente contextualizado de apoio à decisão médica.

O diferencial tecnológico não está na criação de um modelo de IA próprio, mas na forma como o Health360 organiza informações, incorpora contexto clínico, aplica regras, estrutura propostas, permite revisão médica e mantém a continuidade do acompanhamento.

O sistema deve demonstrar três capacidades centrais:

**Personalized Prevention:** propostas contextualizadas a partir do histórico do paciente.

**Do Not Test Intelligence:** identificação de possíveis exames redundantes para revisão médica.

**Continuous Preventive Care:** preservação das informações e reavaliação longitudinal.

Priorizar a qualidade e o funcionamento real desses fluxos em vez da quantidade de funcionalidades.

O MVP deverá permanecer restrito a demonstrações com dados sintéticos, sem apresentar propostas como recomendações clínicas validadas ou disponibilizá-las para uso médico real.

**Health360 — Better decisions, not more tests.**
