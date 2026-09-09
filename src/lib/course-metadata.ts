import type { Lesson, Level } from './curriculum.ts';

export const disciplines = { everyday:'Dia a dia', work:'Trabalho', travel:'Viagens', school:'Escola', technology:'Tecnologia', science:'Ciência', culture:'Cultura', exchange:'Intercâmbio' } as const;
export const skills = { listening:'Ouvir', speaking:'Falar', reading:'Ler', writing:'Escrever', vocabulary:'Vocabulário', grammar:'Gramática', pronunciation:'Pronúncia' } as const;
export const functions = { introduce:'Apresentar e descrever', information:'Pedir e confirmar informações', narrate:'Contar experiências', problem:'Resolver problemas', negotiate:'Negociar', opinion:'Dar opinião', disagree:'Discordar com respeito', argue:'Argumentar', mediate:'Mediar e adaptar a mensagem' } as const;
export const languageTopics = { be:'Verbo be', articles:'Artigos e plurais', possession:'Posse e referência', present:'Presente simples', place:'Localização e direções', quantities:'Quantidades', modals:'Pedidos, regras e possibilidades', continuous:'Ações em andamento', past:'Passado', comparison:'Comparações', perfect:'Experiências e duração', future:'Planos e futuro', conditionals:'Condições e hipóteses', connectors:'Conectores e coesão', reported:'Discurso relatado', relative:'Orações relativas', passive:'Voz passiva', verbPatterns:'Combinações de verbos', register:'Tom e formalidade', evidence:'Evidência e grau de certeza', inference:'Inferência e sentido implícito', emphasis:'Ênfase e estilo' } as const;
export const stages = { foundation:'Fundamentos', guided:'Prática guiada', transfer:'Aplicar em outro contexto', consolidation:'Consolidação' } as const;
export const practiceTypes = { explanation:'Explicação', dialogue:'Diálogo', listening:'Escuta', simulation:'Simulação', oral:'Produção oral', writing:'Produção escrita' } as const;
export type Discipline = keyof typeof disciplines;
export type Skill = keyof typeof skills;
export type CommunicativeFunction = keyof typeof functions;
export type LanguageTopic = keyof typeof languageTopics;
export type Stage = keyof typeof stages;
export type LessonMetadata = { level:Level; primary:Discipline; secondary:Discipline[]; skills:Skill[]; focusSkills:Skill[]; functions:CommunicativeFunction[]; language:LanguageTopic[]; practice:(keyof typeof practiceTypes)[]; stage:Stage; outcome:string };
type ModulePlan = { objective:string; primary:Discipline; secondary:Discipline[]; functions:CommunicativeFunction[]; language:LanguageTopic[]; prerequisite?:string };
const plan = (objective:string,primary:Discipline,secondary:Discipline[],fn:CommunicativeFunction[],language:LanguageTopic[],prerequisite?:string):ModulePlan => ({objective,primary,secondary,functions:fn,language,prerequisite});
// Editorial metadata: identifiers remain stable so existing account progress is preserved.
export const modulePlans: Record<string,ModulePlan> = {
 'a1-identidade':plan('apresentar a si e outra pessoa e confirmar nome, origem e idade','everyday',['exchange'],['introduce','information'],['be']),
 'a1-pessoas':plan('descrever pessoas e objetos e indicar quantidade e posse','everyday',[],['introduce'],['articles','possession']),
 'a1-rotina':plan('perguntar e responder sobre hábitos, horários e datas','everyday',['work','school'],['information','introduce'],['present']),
 'a1-casa':plan('localizar objetos, pedir direções e seguir instruções de transporte','everyday',['travel','exchange'],['information'],['place']),
 'a1-consumo':plan('fazer um pedido de comida e escolher produtos por preço e tamanho','everyday',['travel'],['information','opinion'],['quantities','modals']),
 'a1-interacao':plan('pedir permissão e descrever habilidades e ações que acontecem agora','everyday',['school'],['information','introduce'],['modals','continuous']),
 'a2-passado':plan('relatar um acontecimento passado em uma sequência compreensível','everyday',['culture'],['narrate'],['past','continuous']),
 'a2-escolhas':plan('comparar opções e justificar uma escolha com quantidade e qualidade','everyday',['travel'],['opinion'],['comparison','quantities']),
 'a2-experiencias':plan('distinguir experiências, resultados recentes e acontecimentos com data','everyday',['travel'],['narrate'],['perfect','past']),
 'a2-planos':plan('combinar compromissos e explicar planos e condições futuras','everyday',['work'],['negotiate','information'],['future','conditionals']),
 'a2-servicos':plan('reservar serviços, explicar um problema e alterar um compromisso','travel',['everyday'],['problem','information'],['modals']),
 'a2-textos':plan('interpretar uma confirmação e escrever um pedido com motivo e ação claros','everyday',['school','travel'],['information','problem'],['connectors','modals']),
 'a2-comunicacao':plan('confirmar uma rota, pedir esclarecimentos e renegociar um horário','travel',['everyday','exchange'],['information','problem','negotiate'],['modals','place']),
 'b1-narrativas':plan('contar uma história distinguindo cenário, sequência e fala relatada','everyday',['culture'],['narrate'],['past','perfect','reported']),
 'b1-argumentos':plan('defender uma opinião com razões, exemplos e ressalvas','everyday',['work','school'],['opinion','argue','disagree'],['connectors','evidence']),
 'b1-hipoteses':plan('comparar decisões possíveis e imaginárias e explicar suas condições','everyday',['work'],['opinion','problem'],['modals','conditionals']),
 'b1-precisao':plan('identificar referências e reformular frases com foco e combinações naturais','everyday',['school'],['introduce','information'],['relative','passive','verbPatterns']),
 'b1-colaboracao':plan('esclarecer um problema, negociar um prazo e resumir decisões','work',['everyday'],['information','problem','negotiate'],['modals','register']),
 'b1-leitura':plan('comparar fontes e produzir um plano com justificativa e próximos passos','school',['exchange'],['argue','information'],['inference','connectors','register']),
 'b2-argumentacao':plan('defender uma posição e responder a objeções com critérios e condições','work',['school','technology'],['argue','disagree','negotiate'],['connectors','evidence','conditionals'],'b1-argumentos'),
 'b2-autonomia':plan('reformular informações e apresentar uma recomendação com consequências','work',['everyday'],['problem','mediate','argue'],['reported','register','conditionals']),
 'c1-sintese':plan('sintetizar fontes em tensão e produzir um parecer com limites explícitos','school',['science'],['argue','mediate'],['evidence','connectors','register'],'b2-autonomia'),
 'c1-interacao':plan('mediar posições e registrar um acordo adequado ao público','work',['school'],['mediate','negotiate'],['register','inference','emphasis']),
 'c1-evidencias':plan('explicar método e incerteza e recomendar uma ação baseada em evidências','science',['school','work'],['argue','mediate'],['evidence','connectors']),
 'c2-nuance':plan('reconstruir argumentos ambíguos distinguindo concessão, pressuposto e ironia','culture',['work'],['argue','mediate'],['inference','emphasis']),
 'c2-producao':plan('sintetizar perspectivas e defender uma proposta sob contestação','work',['school'],['mediate','argue'],['reported','register','emphasis']),
 'c2-estilo-cultura':plan('comparar vozes e alusões culturais e defender uma leitura crítica','culture',['school','exchange'],['mediate','argue'],['inference','emphasis','register']),
 'b1-vida-em-movimento':plan('explicar um atraso ou defeito e combinar uma solução','travel',['everyday'],['problem','negotiate'],['past','modals'],'b1-colaboracao'),
 'b2-acordos-cotidianos':plan('negociar convivência e recomendar um roteiro acessível','everyday',['travel','exchange'],['negotiate','argue'],['conditionals','register'],'b2-argumentacao'),
 'c1-intencoes-e-impacto':plan('interpretar pedidos implícitos e transformar feedback em orientação','work',['everyday'],['mediate','information'],['inference','register'],'c1-interacao'),
 'c2-significado-em-disputa':plan('contestar premissas e reparar ironia entre culturas','culture',['exchange'],['mediate','disagree'],['inference','register'],'c2-nuance'),
};
// Each slot describes the actual linguistic focus of the numbered lesson.
const topicSlots:Record<string,LanguageTopic[]> = {
 'a1-pessoas':['articles','articles','possession','possession','possession','be'],
 'a1-consumo':['modals','present','quantities','quantities','quantities','comparison'],
 'a1-interacao':['modals','modals','continuous','continuous','continuous','present'],
 'a2-passado':['be','past','past','past','connectors','continuous'],
 'a2-escolhas':['comparison','comparison','comparison','quantities','quantities','quantities'],
 'a2-experiencias':['perfect','perfect','perfect','perfect','perfect','past'],
 'a2-planos':['future','future','continuous','modals','conditionals','conditionals'],
 'a2-textos':['possession','connectors','register','connectors','modals','modals'],
 'b1-narrativas':['past','perfect','continuous','perfect','reported','modals'],
 'b1-argumentos':['connectors','connectors','connectors','comparison','modals','evidence'],
 'b1-hipoteses':['modals','modals','conditionals','conditionals','conditionals','modals'],
 'b1-precisao':['relative','passive','passive','verbPatterns','verbPatterns','verbPatterns'],
 'b1-colaboracao':['modals','register','modals','register','register','reported'],
 'b1-leitura':['inference','inference','evidence','register','connectors','connectors'],
 'b2-argumentacao':['connectors','evidence','register','comparison','conditionals','connectors'],
 'b2-autonomia':['reported','register','register','connectors','conditionals','evidence'],
 'c1-sintese':['evidence','evidence','connectors','reported','connectors','evidence'],
 'c1-interacao':['register','register','inference','emphasis','register','conditionals'],
};
const focusByMechanic:Record<string,Skill[]> = {
 'Imagine esta situação':['speaking','vocabulary'],
 'Encontre o que precisa mudar':['grammar','reading'],
 'Preste atenção aos sons':['listening','pronunciation'],
 'Compare as formas de dizer':['grammar','vocabulary'],
 'Escolha de acordo com a situação':['reading','listening'],
 'Monte a frase passo a passo':['writing','speaking'],
};
const overrides:Record<string,Partial<LessonMetadata>> = {
 'a1-rotina-05':{focusSkills:['listening','reading'],primary:'school',secondary:['everyday','exchange']},
 'a1-identidade-06':{primary:'exchange',secondary:['everyday']},
 'a1-casa-04':{primary:'travel',secondary:['everyday','exchange']},
 'a1-casa-05':{primary:'travel',secondary:['everyday']},
 'a2-textos-03':{primary:'travel',secondary:['everyday']},
 'a2-textos-04':{primary:'travel',secondary:['everyday'],language:['connectors'],functions:['opinion']},
 'a2-textos-05':{primary:'school',secondary:['exchange'],functions:['information']},
 'a2-servicos-04':{primary:'travel',secondary:['exchange']},
 'a2-servicos-05':{primary:'everyday',secondary:[]},
 'b1-precisao-04':{primary:'technology',secondary:['school'],functions:['narrate']},
 'b2-argumentacao-02':{focusSkills:['listening','reading'],primary:'science',secondary:['work']},
 'b2-argumentacao-04':{primary:'technology',secondary:['work','school']},
 'b2-argumentacao-06':{focusSkills:['listening','speaking','writing'],primary:'technology',secondary:['school','exchange']},
 'b1-leitura-03':{primary:'school',secondary:['exchange']},
 'b1-leitura-05':{primary:'school',secondary:['exchange']},
 'b2-acordos-cotidianos-02':{primary:'travel',secondary:['everyday']},
};
export function metadataFor(lesson:Lesson,position:number,total:number):LessonMetadata {
 const p=modulePlans[lesson.moduleId!];
 if(!p) throw new Error('Missing module metadata: '+lesson.moduleId);
 const numbered=Number(lesson.id.slice(-2))-1;
 const topic=topicSlots[lesson.moduleId!]?.[numbered];
 const kinds=new Set(lesson.steps.map(s=>s.kind));
 const skill:Skill[]=['reading'];
 if(kinds.has('dialogue')||kinds.has('listening_detail')) skill.push('listening');
 if(kinds.has('production')) skill.push('writing','speaking');
 if(kinds.has('pronunciation')) skill.push('pronunciation');
 if(kinds.has('vocabulary')) skill.push('vocabulary');
 if(kinds.has('teach')||kinds.has('complete_sentence')) skill.push('grammar');
 return {level:lesson.level,primary:p.primary,secondary:[...p.secondary],skills:skill,focusSkills:(focusByMechanic[lesson.experience.mechanic]??["reading","speaking"]).filter(s=>skill.includes(s as Skill)) as Skill[],functions:[...p.functions],language:topic?[topic]:[...p.language],practice:['explanation','dialogue','listening','oral','writing'],stage:total<=2?'transfer':position===0?'foundation':position===total-1?'consolidation':position<3?'guided':'transfer',outcome:lesson.title.charAt(0).toLowerCase()+lesson.title.slice(1),...overrides[lesson.id]};
}
export type CompetencyPath = {id:string;title:string;discipline:Discipline;steps:{stage:Stage;lessonId:string;task:string}[]};
// Transfer prompts make the cross-disciplinary application explicit without inventing lesson content or completions.
export const competencyPaths:CompetencyPath[] = [
 {id:'opinions',title:'Da opinião à mediação',discipline:'culture',steps:[
  {stage:'foundation',lessonId:'a2-textos-04',task:'Choose a review you agree with. State your opinion and one reason.'},
  {stage:'guided',lessonId:'b1-argumentos-03',task:'Support your opinion with a specific example, not just a claim.'},
  {stage:'transfer',lessonId:'b2-argumentacao-03',task:'A colleague disagrees. Acknowledge their concern and propose an alternative.'},
  {stage:'consolidation',lessonId:'c1-interacao-02',task:'Summarize two conflicting positions fairly and propose a shared next step.'}]},
 {id:'work',title:'Colaborar e negociar no trabalho',discipline:'work',steps:[
  {stage:'foundation',lessonId:'a2-comunicacao-06',task:'Tell a colleague you will be late and suggest a new meeting time.'},
  {stage:'guided',lessonId:'b1-colaboracao-03',task:'Request a realistic deadline and explain the constraint.'},
  {stage:'transfer',lessonId:'b2-argumentacao-05',task:'Negotiate a delivery date while keeping the agreed scope clear.'},
  {stage:'consolidation',lessonId:'c1-interacao-06',task:'Record an agreement with responsibilities, conditions and a review date.'}]},
 {id:'travel',title:'Viajar com autonomia',discipline:'travel',steps:[
  {stage:'foundation',lessonId:'a1-casa-04',task:'Ask how to get to the station and confirm the first turn.'},
  {stage:'guided',lessonId:'a2-comunicacao-02',task:'Check the route, stop and direction before boarding.'},
  {stage:'transfer',lessonId:'b1-vida-em-movimento-01',task:'Explain a travel delay and agree on a workable backup plan.'},
  {stage:'consolidation',lessonId:'b2-acordos-cotidianos-02',task:'Recommend an accessible route and justify the trade-offs.'}]},
 {id:'science',title:'Explicar e avaliar evidências',discipline:'science',steps:[
  {stage:'foundation',lessonId:'b1-argumentos-06',task:'For a class survey, distinguish an observed fact from an opinion and an uncertain explanation.'},
  {stage:'guided',lessonId:'b2-argumentacao-02',task:'Describe the observed change and two possible explanations without claiming causation.'},
  {stage:'transfer',lessonId:'c1-evidencias-03',task:'Explain a survey interval to a non-specialist and state one decision it cannot support.'},
  {stage:'consolidation',lessonId:'c1-evidencias-06',task:'Write a short briefing with evidence, limitations and a reviewable recommendation.'}]},
 {id:'technology',title:'Avaliar soluções tecnológicas',discipline:'technology',steps:[
  {stage:'foundation',lessonId:'b1-precisao-04',task:'Describe an online course you enjoyed and a tool you decided to try.'},
  {stage:'guided',lessonId:'b2-argumentacao-04',task:'Compare two digital tools using the same cost and accessibility criteria.'},
  {stage:'transfer',lessonId:'b2-argumentacao-06',task:'Respond to a family that cannot access a school app. Propose an inclusive alternative.'},
  {stage:'consolidation',lessonId:'c1-evidencias-02',task:'Rewrite a claim about remote learning, preserving the sample, timeframe and uncertainty.'}]},
 {id:'exchange',title:'Participar da vida escolar no intercâmbio',discipline:'exchange',steps:[
  {stage:'foundation',lessonId:'a1-rotina-05',task:'Ask when your class starts and repeat the time to confirm.'},
  {stage:'guided',lessonId:'a2-textos-05',task:'Write to a school asking for the timetable and course prices.'},
  {stage:'transfer',lessonId:'b1-leitura-03',task:'Compare a school poster with an updated email. Explain what changed and what stayed the same.'},
  {stage:'consolidation',lessonId:'b1-leitura-06',task:'Plan a study session with a place, reason, responsibilities and an alternative.'}]},
];
