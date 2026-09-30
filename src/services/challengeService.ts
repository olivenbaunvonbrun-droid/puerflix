import { ChallengeSubject, EducationalChallenge, KidAgeGroup } from '../types';

interface ChallengeTemplate {
  subject: ChallengeSubject;
  ageGroup: KidAgeGroup;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  visualEmoji?: string;
}

const CHALLENGE_BANK: ChallengeTemplate[] = [
  // ==================== FAIXA 3-5 ANOS ====================
  // Matemática 3-5
  {
    subject: 'MATH',
    ageGroup: '3-5',
    question: 'Quantas maçãs você vê aqui?\n🍎 🍎 🍎',
    options: ['2', '3', '4', '1'],
    correctIndex: 1,
    explanation: 'Muito bem! São 3 maçãs vermelhas!',
    visualEmoji: '🍎',
  },
  {
    subject: 'MATH',
    ageGroup: '3-5',
    question: 'Quantas estrelinhas estão brilhando?\n⭐ ⭐ ⭐ ⭐ ⭐',
    options: ['3', '4', '5', '6'],
    correctIndex: 2,
    explanation: 'Excelente! Você contou 5 estrelinhas!',
    visualEmoji: '⭐',
  },
  {
    subject: 'MATH',
    ageGroup: '3-5',
    question: 'Quanto é 1 ursinho + 1 ursinho?\n🧸 + 🧸 = ?',
    options: ['1', '2', '3', '0'],
    correctIndex: 1,
    explanation: 'Isso! 1 + 1 é igual a 2!',
    visualEmoji: '🧸',
  },
  {
    subject: 'MATH',
    ageGroup: '3-5',
    question: 'Quantos peixinhos estão nadando?\n🐟 🐟',
    options: ['1', '2', '3', '4'],
    correctIndex: 1,
    explanation: 'Parabéns! São 2 peixinhos!',
    visualEmoji: '🐟',
  },

  // Lógica 3-5
  {
    subject: 'LOGIC',
    ageGroup: '3-5',
    question: 'Qual destes animaizinhos faz "Miau"?',
    options: ['Cachorrinho 🐶', 'Gatinho 🐱', 'Vaquinha 🐮', 'Sapinho 🐸'],
    correctIndex: 1,
    explanation: 'Acertou! O gatinho faz miau!',
    visualEmoji: '🐱',
  },
  {
    subject: 'LOGIC',
    ageGroup: '3-5',
    question: 'Qual objeto usamos nos pés?',
    options: ['Chapéu 🎩', 'Meia e Tênis 👟', 'Luva 🧤', 'Óculos 👓'],
    correctIndex: 1,
    explanation: 'Muito bem! Calçamos meia e tênis nos pés!',
    visualEmoji: '👟',
  },
  {
    subject: 'LOGIC',
    ageGroup: '3-5',
    question: 'Qual cor tem o céu num dia bonito e ensolarado?',
    options: ['Azul 💙', 'Verde 💚', 'Preto 🖤', 'Roxo 💜'],
    correctIndex: 0,
    explanation: 'Isso mesmo! O céu de dia é azul!',
    visualEmoji: '☀️',
  },
  {
    subject: 'LOGIC',
    ageGroup: '3-5',
    question: 'Qual desses alimentos é uma fruta docinha?',
    options: ['Banana 🍌', 'Cebola 🧅', 'Pimenta 🌶️', 'Sabonete 🧼'],
    correctIndex: 0,
    explanation: 'Delícia! A banana é uma fruta muito gostosa!',
    visualEmoji: '🍌',
  },

  // Linguagem 3-5
  {
    subject: 'LANGUAGE',
    ageGroup: '3-5',
    question: 'Com qual letrinha começa a palavra ABELHA? 🐝',
    options: ['Letra A', 'Letra B', 'Letra O', 'Letra U'],
    correctIndex: 0,
    explanation: 'Perfeito! A de Abelha!',
    visualEmoji: '🐝',
  },
  {
    subject: 'LANGUAGE',
    ageGroup: '3-5',
    question: 'Com qual letrinha começa a palavra BOLA? ⚽',
    options: ['Letra M', 'Letra B', 'Letra P', 'Letra D'],
    correctIndex: 1,
    explanation: 'Show! B de Bola!',
    visualEmoji: '⚽',
  },
  {
    subject: 'LANGUAGE',
    ageGroup: '3-5',
    question: 'Com qual letrinha começa a palavra ELEFANTE? 🐘',
    options: ['Letra I', 'Letra E', 'Letra A', 'Letra U'],
    correctIndex: 1,
    explanation: 'Certinho! E de Elefante!',
    visualEmoji: '🐘',
  },

  // ==================== FAIXA 6-8 ANOS ====================
  // Matemática 6-8
  {
    subject: 'MATH',
    ageGroup: '6-8',
    question: 'Quanto é 7 + 8?',
    options: ['14', '15', '16', '13'],
    correctIndex: 1,
    explanation: '7 + 8 = 15! Excelente raciocínio!',
    visualEmoji: '➕',
  },
  {
    subject: 'MATH',
    ageGroup: '6-8',
    question: 'Se você tem 12 balas e comeu 4, quantas sobraram?',
    options: ['6', '7', '8', '9'],
    correctIndex: 2,
    explanation: '12 - 4 = 8 balas restantes! Muito bem!',
    visualEmoji: '🍬',
  },
  {
    subject: 'MATH',
    ageGroup: '6-8',
    question: 'Quanto é 5 × 3?',
    options: ['12', '15', '18', '20'],
    correctIndex: 1,
    explanation: '5 somado 3 vezes é 15! Parabéns!',
    visualEmoji: '✖️',
  },
  {
    subject: 'MATH',
    ageGroup: '6-8',
    question: 'Qual número vem logo antes do 50?',
    options: ['48', '49', '51', '40'],
    correctIndex: 1,
    explanation: 'O antecessor de 50 é o 49!',
    visualEmoji: '🔢',
  },

  // Lógica 6-8
  {
    subject: 'LOGIC',
    ageGroup: '6-8',
    question: 'Qual dos itens NÃO pertence ao grupo?',
    options: ['Maçã 🍎', 'Banana 🍌', 'Cenoura 🥕', 'Morango 🍓'],
    correctIndex: 2,
    explanation: 'A cenoura é um legume/raiz, enquanto os outros são frutas!',
    visualEmoji: '🥕',
  },
  {
    subject: 'LOGIC',
    ageGroup: '6-8',
    question: 'Complete a sequência: 2, 4, 6, 8, ...?',
    options: ['9', '10', '11', '12'],
    correctIndex: 1,
    explanation: 'A sequência pula de 2 em 2, portanto o próximo é 10!',
    visualEmoji: '💡',
  },
  {
    subject: 'LOGIC',
    ageGroup: '6-8',
    question: 'Se ontem foi Terça-feira, que dia é HOJE?',
    options: ['Segunda-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'],
    correctIndex: 1,
    explanation: 'Depois de terça-feira sempre vem quarta-feira!',
    visualEmoji: '📅',
  },

  // Linguagem 6-8
  {
    subject: 'LANGUAGE',
    ageGroup: '6-8',
    question: 'Qual palavra rima com "CORAÇÃO"?',
    options: ['Amigo', 'Avião', 'Cadeira', 'Sol'],
    correctIndex: 1,
    explanation: 'Coração e Avião terminam com o mesmo som: ÃO!',
    visualEmoji: '❤️',
  },
  {
    subject: 'LANGUAGE',
    ageGroup: '6-8',
    question: 'Qual é o contrário (antônimo) de "ALTO"?',
    options: ['Baixo', 'Largo', 'Forte', 'Rápido'],
    correctIndex: 0,
    explanation: 'O contrário de alto é baixo!',
    visualEmoji: '📏',
  },
  {
    subject: 'LANGUAGE',
    ageGroup: '6-8',
    question: 'Quantas sílabas tem a palavra "BORBOLETA"?',
    options: ['2', '3', '4', '5'],
    correctIndex: 2,
    explanation: 'Bor-bo-le-ta tem 4 sílabas!',
    visualEmoji: '🦋',
  },

  // ==================== FAIXA 9-11 ANOS ====================
  // Matemática 9-11
  {
    subject: 'MATH',
    ageGroup: '9-11',
    question: 'Quanto é 7 × 9?',
    options: ['54', '63', '72', '56'],
    correctIndex: 1,
    explanation: '7 × 9 = 63! Tabuada na ponta da língua!',
    visualEmoji: '🧠',
  },
  {
    subject: 'MATH',
    ageGroup: '9-11',
    question: 'Quanto é 72 dividido por 8?',
    options: ['7', '8', '9', '6'],
    correctIndex: 2,
    explanation: '72 ÷ 8 = 9, pois 9 × 8 = 72!',
    visualEmoji: '➗',
  },
  {
    subject: 'MATH',
    ageGroup: '9-11',
    question: 'Um retângulo tem base de 6cm e altura de 4cm. Qual é a sua área?',
    options: ['20 cm²', '24 cm²', '10 cm²', '18 cm²'],
    correctIndex: 1,
    explanation: 'Área do retângulo = base × altura = 6 × 4 = 24 cm²!',
    visualEmoji: '📐',
  },
  {
    subject: 'MATH',
    ageGroup: '9-11',
    question: 'Quanto é a metade de 150?',
    options: ['65', '70', '75', '80'],
    correctIndex: 2,
    explanation: '150 dividido por 2 é exatamente 75!',
    visualEmoji: '🎯',
  },

  // Lógica 9-11
  {
    subject: 'LOGIC',
    ageGroup: '9-11',
    question: 'Qual número completa a sequência lógica? 3, 6, 12, 24, ...?',
    options: ['36', '48', '30', '52'],
    correctIndex: 1,
    explanation: 'Cada número é o dobro do anterior: 24 × 2 = 48!',
    visualEmoji: '🧩',
  },
  {
    subject: 'LOGIC',
    ageGroup: '9-11',
    question: 'O pai do Pedro tem 3 filhos: Tico, Teco e ...?',
    options: ['Tuco', 'Pedro', 'Tonho', 'Tobias'],
    correctIndex: 1,
    explanation: 'A pergunta começa dizendo "O pai do Pedro", logo o terceiro filho é o Pedro!',
    visualEmoji: '🤔',
  },
  {
    subject: 'LOGIC',
    ageGroup: '9-11',
    question: 'Se um avião viaja 800 km em 1 hora, quantos km ele viaja em 3 horas?',
    options: ['1600 km', '2400 km', '2000 km', '3200 km'],
    correctIndex: 1,
    explanation: '800 × 3 = 2400 km!',
    visualEmoji: '✈️',
  },

  // Linguagem 9-11
  {
    subject: 'LANGUAGE',
    ageGroup: '9-11',
    question: 'Na frase "O cachorro VELOZ correu no parque", a palavra VELOZ é:',
    options: ['Um substantivo', 'Um adjetivo', 'Um verbo', 'Um pronome'],
    correctIndex: 1,
    explanation: 'Veloz é uma qualidade/característica do cachorro, portanto é um adjetivo!',
    visualEmoji: '🐕',
  },
  {
    subject: 'LANGUAGE',
    ageGroup: '9-11',
    question: 'Qual palavra é sinônimo de "ALEGRE"?',
    options: ['Contente', 'Triste', 'Cansado', 'Bravo'],
    correctIndex: 0,
    explanation: 'Alegre e contente possuem o mesmo significado!',
    visualEmoji: '😊',
  },
  {
    subject: 'LANGUAGE',
    ageGroup: '9-11',
    question: 'Qual a grafia correta da palavra para o plural de "PASTEL"?',
    options: ['Pasteis', 'Pastéis', 'Pastels', 'Pasteiz'],
    correctIndex: 1,
    explanation: 'O plural de pastel é pastéis, com acento agudo no E!',
    visualEmoji: '🥟',
  },

  // ==================== FAIXA 12+ ANOS ====================
  // Matemática 12+
  {
    subject: 'MATH',
    ageGroup: '12+',
    question: 'Qual é 25% de 120?',
    options: ['25', '30', '35', '40'],
    correctIndex: 1,
    explanation: '25% é a quarta parte: 120 ÷ 4 = 30!',
    visualEmoji: '📊',
  },
  {
    subject: 'MATH',
    ageGroup: '12+',
    question: 'Resolva a equação de primeiro grau: 2x + 6 = 20. Qual o valor de x?',
    options: ['5', '6', '7', '8'],
    correctIndex: 2,
    explanation: '2x = 20 - 6 => 2x = 14 => x = 7!',
    visualEmoji: '🧮',
  },
  {
    subject: 'MATH',
    ageGroup: '12+',
    question: 'Qual é a raiz quadrada de 144?',
    options: ['11', '12', '13', '14'],
    correctIndex: 1,
    explanation: '12 × 12 = 144, portanto a raiz de 144 é 12!',
    visualEmoji: '√',
  },

  // Lógica 12+
  {
    subject: 'LOGIC',
    ageGroup: '12+',
    question: 'Se todos os mamíferos respiram ar e a baleia é um mamífero, então:',
    options: [
      'A baleia respira ar',
      'A baleia respira debaixo d\'água como peixe',
      'A baleia não é mamífero',
      'Nenhum mamífero vive no mar'
    ],
    correctIndex: 0,
    explanation: 'Silogismo lógico dedutivo: se a baleia é mamífero, ela necessariamente respira ar!',
    visualEmoji: '🐋',
  },
  {
    subject: 'LOGIC',
    ageGroup: '12+',
    question: 'Qual o próximo número na sequência dos quadrados perfeitos: 1, 4, 9, 16, 25, ...?',
    options: ['30', '36', '49', '32'],
    correctIndex: 1,
    explanation: '1², 2², 3², 4², 5²... o próximo é 6² = 36!',
    visualEmoji: '💡',
  },

  // Linguagem 12+
  {
    subject: 'LANGUAGE',
    ageGroup: '12+',
    question: 'Qual é a figura de linguagem presente em: "Chorou rios de lágrimas"?',
    options: ['Hipérbole (Exagero)', 'Metáfora', 'Eufemismo', 'Ironia'],
    correctIndex: 0,
    explanation: 'Trata-se de uma hipérbole, pois há um exagero intencional na expressão!',
    visualEmoji: '📖',
  },
  {
    subject: 'LANGUAGE',
    ageGroup: '12+',
    question: 'Em "Nós fomos ao cinema", qual é o sujeito da oração?',
    options: ['cinema', 'Nós', 'fomos', 'ao'],
    correctIndex: 1,
    explanation: '"Nós" é o sujeito simples que pratica a ação de ir!',
    visualEmoji: '✍️',
  },
];

export const ChallengeService = {
  /**
   * Generates a randomized list of challenges tailored to the given age group and enabled subjects
   */
  generateChallenges(
    count: number,
    ageGroup: KidAgeGroup = '6-8',
    enabledSubjects: ChallengeSubject[] = ['MATH', 'LOGIC', 'LANGUAGE']
  ): EducationalChallenge[] {
    const activeSubjects = enabledSubjects.length > 0 ? enabledSubjects : ['MATH', 'LOGIC', 'LANGUAGE'];

    // Filter available templates matching age and subjects
    let pool = CHALLENGE_BANK.filter(
      item => item.ageGroup === ageGroup && activeSubjects.includes(item.subject)
    );

    // Fallback if pool is too small: include adjacent age groups
    if (pool.length < count) {
      pool = CHALLENGE_BANK.filter(item => activeSubjects.includes(item.subject));
    }

    // Shuffle pool
    const shuffled = [...pool].sort(() => 0.5 - Math.random());

    // Pick count items
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    return selected.map((item, idx) => ({
      id: `challenge_${Date.now()}_${idx}`,
      ...item,
    }));
  },

  getSubjectLabel(subject: ChallengeSubject): string {
    switch (subject) {
      case 'MATH': return 'Matemática Divertida';
      case 'LOGIC': return 'Desafio de Lógica';
      case 'LANGUAGE': return 'Língua & Palavras';
    }
  },

  getSubjectBadgeColor(subject: ChallengeSubject): string {
    switch (subject) {
      case 'MATH': return '#3B82F6'; // Blue
      case 'LOGIC': return '#8B5CF6'; // Purple
      case 'LANGUAGE': return '#10B981'; // Green
    }
  },
};
