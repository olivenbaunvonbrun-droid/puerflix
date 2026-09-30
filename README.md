# 🛡️ PuerTube (Android App)

> **"Vídeos escolhidos pelos pais. Liberdade segura para os filhos."**

O **PuerTube** é uma alternativa segura, confiável e livre de conteúdo nocivo ao YouTube tradicional, desenvolvida especificamente para crianças e controlada com rigor absoluto pelos pais.

---

## 🔒 Por que o PuerTube existe?

Hoje, mesmo em plataformas com divisão para crianças, pais e filhos sofrem constantemente com:
- Vídeos de **Brain Rot** e estímulos hiper-acelerados;
- Adultos infantilizados com pegadinhas ou comportamentos questionáveis;
- Adolescentes ensinando coisas inadequadas;
- Algoritmos de recomendação automáticos que acabam puxando conteúdos indesejados.

### A Filosofia da "Lista Branca Estrita" (Whitelist)
No **PuerTube**, **NENHUM VÍDEO** é recomendado ou exibido se não pertencer a um canal expressamente autorizado pelos pais na área de configurações protegida por senha.

---

## ✨ Principais Recursos

1. **Área dos Pais Protegida por PIN (4 Dígitos)**:
   - Interface segura com teclado numérico e pergunta de recuperação de senha.
   - Campo para colar URLs de canais do YouTube (`https://youtube.com/@NomeDoCanal`, `@handle`, ou ID `UC...`).
   - Resolução inteligente automática: identifica o canal, avatar e títulos sem burocracia.
   - Gerenciador de canais ativos (permite pausar ou excluir canais a qualquer momento).
   - Sugestões de canais educativos de altíssima qualidade prontos para ativar com 1 toque (*Manual do Mundo*, *Turma da Mônica*, *O Show da Luna*, *Palavra Cantada*, *Ciência Todo Dia*).

2. **Interface Semelhante ao YouTube, mas Segura**:
   - Barra superior com logo e slogan lúdico.
   - Barra de pesquisa restrita **estritamente** aos vídeos dos canais aprovados (impossível vazar conteúdo de fora).
   - Filtros rápidos por canal em formato de chips horizontais.
   - Cards de vídeo com miniatura em alta resolução, avatar do canal e selo verde de "Canal Aprovado".

3. **Player Blindado**:
   - Reprodução fluida e de alta qualidade.
   - Parâmetros de segurança que desativam sugestões e anotações externas (`rel=0`, `iv_load_policy=3`).
   - Carrossel de "Próximos Vídeos" puxado exclusivamente dos canais cadastrados pela família.

4. **Controle de Tempo de Tela Diário (Descanso dos Olhinhos)**:
   - Os pais podem definir limite diário (30 min, 45 min, 1h, 1h30, 2h ou Sem limite).
   - Ao atingir o tempo, uma tela amigável incentiva a criança a brincar ou descansar, com botão de liberação apenas para os pais.

5. **Motor Flexível e Gratuito**:
   - Utiliza feeds RSS públicos do YouTube: **100% gratuito**, sem exigir pagamento nem chave de API obrigatória.
   - Campo opcional nas configurações caso o pai deseje adicionar uma chave do Google Cloud.

---

## 🚀 Como Executar e Testar o App

### 1. Testar diretamente no seu Celular Android (Recomendado)
1. No seu celular Android, baixe o aplicativo gratuito **Expo Go** na Google Play Store.
2. No terminal do seu computador, dentro da pasta `puertube`, execute:
   ```bash
   npx expo start
   ```
3. Um **QR Code** aparecerá no seu terminal.
4. Abra o aplicativo **Expo Go** no celular e toque em **"Scan QR code"**.
5. O PuerTube carregará instantaneamente no seu celular, funcionando nativamente!

### 2. Testar no Navegador (Web Preview)
Para ver o app funcionando na tela do computador:
```bash
npx expo start --web
```

### 3. Como Gerar o Arquivo APK do Android
Para gerar o arquivo `.apk` instalável em qualquer celular Android:
1. Instale o EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Crie sua conta gratuita no Expo (`eas login`).
3. Execute o comando de build do APK:
   ```bash
   eas build -p android --profile preview
   ```
4. Ao finalizar, o link direto para download do arquivo `.apk` será gerado automaticamente.

---

## 📂 Estrutura de Arquivos

```
puertube/
├── App.tsx                     # Ponto de entrada, rotas e controle de tempo
├── app.json                    # Metadados do pacote Android (com.puertube.app)
├── package.json                # Dependências instaladas
├── src/
│   ├── components/
│   │   ├── Header.tsx          # Cabeçalho com logo, slogan e botão dos pais
│   │   ├── ChannelChips.tsx    # Filtros horizontais por canal
│   │   ├── VideoCard.tsx       # Card de vídeo estilo YouTube com selo de canal aprovado
│   │   ├── PinModal.tsx        # Teclado numérico seguro de 4 dígitos
│   │   ├── SafePlayer.tsx      # Player YouTube blindado sem links externos
│   │   └── ScreenTimeModal.tsx # Bloqueio de tempo de tela diário
│   ├── screens/
│   │   ├── HomeScreen.tsx      # Feed seguro para a criança
│   │   ├── WatchScreen.tsx     # Tela de reprodução e recomendações autorizadas
│   │   ├── SearchScreen.tsx    # Busca restrita aos canais permitidos
│   │   └── ParentalSettingsScreen.tsx # Painel dos pais com senha
│   ├── services/
│   │   ├── youtubeService.ts   # Resolvedor de links e buscador de vídeos via RSS
│   │   └── storageService.ts   # Persistência local (AsyncStorage) de canais e PIN
│   ├── constants/
│   │   ├── theme.ts            # Cores e tipografia infantil moderna
│   │   └── presets.ts          # Canais educativos pré-selecionados
│   └── types/
│       └── index.ts            # Modelos de dados em TypeScript
```
