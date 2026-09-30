import { Channel, WatchEvent } from '../types';

export interface ConversationPrompt {
  id: string;
  topic: string;
  channelName: string;
  emoji: string;
  questionForKid: string;
  parentInsight: string;
  suggestedMoment: 'JANTAR' | 'HORA_DE_DORMIR' | 'PASSEIO';
}

export const AiGuardianService = {
  /**
   * Analyzes recent watch history and generates meaningful, high-connection conversation starters for parents
   */
  generatePrompts(history: { channelTitle: string }[] = [], authorizedChannels: Channel[] = []): ConversationPrompt[] {
    const prompts: ConversationPrompt[] = [];


    // Analyze topics based on recent history or fallback to authorized channels
    const channelsWatched = new Set(history.map(h => h.channelTitle.toLowerCase()));

    // 1. Science & Discovery
    if (channelsWatched.has('o show da luna') || channelsWatched.has('minuto da terra') || authorizedChannels.some(c => c.categoryId === 'ciencia')) {
      prompts.push({
        id: 'p_science_1',
        topic: 'Curiosidade & Ciência',
        channelName: 'O Show da Luna & Ciência',
        emoji: '🔬',
        questionForKid: 'Filho(a), você sabia que até as coisas invisíveis, como o ar, têm peso? O que você mais achou incrível naquela experiência?',
        parentInsight: 'Estimula o pensamento crítico, a investigação empírica e o encantamento pelo método científico.',
        suggestedMoment: 'JANTAR',
      });
    }

    // 2. Emotional Intelligence & Empathy
    if (channelsWatched.has('pingu') || channelsWatched.has('bluey') || authorizedChannels.some(c => c.title.includes('Bluey') || c.title.includes('Pingu'))) {
      prompts.push({
        id: 'p_empathy_1',
        topic: 'Empatia & Emoções',
        channelName: 'Bluey & Pingu',
        emoji: '❤️',
        questionForKid: 'Quando um personagem ficou triste ou bravo hoje no desenho, você reparou como ele respirou ou pediu ajuda? Como a gente pode se ajudar quando algo dá errado?',
        parentInsight: 'Ajuda a criança a nomear sentimentos difíceis (raiva, frustração, ciúme) e a buscar soluções não violentas.',
        suggestedMoment: 'HORA_DE_DORMIR',
      });
    }

    // 3. Nature & Animals
    if (channelsWatched.has('go diego go') || channelsWatched.has('vila sésamo') || authorizedChannels.some(c => c.title.includes('Diego'))) {
      prompts.push({
        id: 'p_nature_1',
        topic: 'Animais & Preservação',
        channelName: 'Go Diego Go & Vila Sésamo',
        emoji: '🐾',
        questionForKid: 'Se você pudesse ser o protetor de qualquer animal da floresta hoje, qual você escolheria para salvar?',
        parentInsight: 'Desenvolve consciência ecológica, carinho pelos seres vivos e espírito de responsabilidade.',
        suggestedMoment: 'PASSEIO',
      });
    }

    // 4. Literacy & Language
    if (channelsWatched.has('alfabrinca') || channelsWatched.has('céu de letras') || authorizedChannels.some(c => c.title.includes('ALFABRINCA') || c.title.includes('Letras'))) {
      prompts.push({
        id: 'p_literacy_1',
        topic: 'Brincadeira com Palavras',
        channelName: 'Alfabrinca & Céu de Letras',
        emoji: '📚',
        questionForKid: 'Vamos fazer um desafio: quem consegue falar 3 coisas na mesa que rimam com "CORAÇÃO"? Valendo!',
        parentInsight: 'A consciência fonológica e as rimas são a chave número 1 para o sucesso da alfabetização infantil.',
        suggestedMoment: 'JANTAR',
      });
    }

    // Fallback general prompt if no specific match
    if (prompts.length === 0) {
      prompts.push({
        id: 'p_general_1',
        topic: 'Imaginação & Criatividade',
        channelName: 'PuerFlix em Família',
        emoji: '✨',
        questionForKid: 'Qual foi a coisa mais engraçada ou diferente que você viu hoje nos seus vídeos do PuerFlix? Me conta como se eu não tivesse visto!',
        parentInsight: 'Desenvolve a narrativa oral, a estruturação de começo/meio/fim e fortalece a cumplicidade entre pais e filhos.',
        suggestedMoment: 'JANTAR',
      });
    }

    return prompts;
  },

  getMomentBadge(moment: 'JANTAR' | 'HORA_DE_DORMIR' | 'PASSEIO'): { label: string; color: string } {
    switch (moment) {
      case 'JANTAR': return { label: '🍽️ Dica para a Mesa do Jantar', color: '#F59E0B' };
      case 'HORA_DE_DORMIR': return { label: '🌙 Dica para a Hora de Dormir', color: '#8B5CF6' };
      case 'PASSEIO': return { label: '🚗 Dica no Carro / Passeio', color: '#10B981' };
    }
  },
};
