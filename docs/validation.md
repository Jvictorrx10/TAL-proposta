# Validação do protótipo TAL

## Referências e análise

Foram geradas quatro referências de seção, em imagens separadas: apresentação, seleção de conceitos, assistência e contato. A implementação preserva os pontos centrais dessas referências:

- Fundo cinza quase branco, sem gradientes; títulos largos e pesados em caixa alta, acompanhados por texto geométrico mais leve.
- Moto sem moldura ocupando a maior parte da apresentação e avançando sobre letras decorativas, com a chamada principal livre e legível.
- Navegação discreta, botões retangulares e contraste preto/branco; hierarquia de aproximadamente 104px para hero, 40–70px para seções, 20px para introduções, 16px para texto e 13px para notas.
- Alternância entre apresentação clara e capítulos escuros. A textura vertical da seção de movimento parte da fachada fornecida pelo usuário.
- Catálogo com seleção real de imagens e informações; assistência em composição dividida; consulta em duas colunas no desktop e uma no celular.

Foram revistas capturas a 1440, 768 e 390px. Ajustes incluíram tamanho das notas, título de dúvidas em duas linhas e separação entre a moto animada e o texto principal.

## Verificações

- TypeScript e build de produção.
- 13 testes de navegador: renderização e imagens nos três tamanhos, troca de conceito com interesse da consulta, navegação por teclado nas abas, acordeão e assistência, rejeição de campos apenas com espaços, cópia real, fallback de cópia, download, menu móvel, movimento reduzido e deslocamento da moto ao rolar.
- Inspeção Taste Skill do código e da página renderizada, incluindo contraste, estouro horizontal, imagens quebradas e contagem de elementos animados.

## Decisões de composição que exigem interpretação

A inspeção visual usa as permissões `covered-text` e `pinned-over-picture` porque a direção escolhida coloca o produto em frente às palavras decorativas “Elétrica”, “Em movimento” e ao nome do conceito em grande escala. Essas palavras estão marcadas com `aria-hidden`; os títulos, descrições e controles reais ficam em outra camada e foram revisados nas capturas. O relatório padrão sem essas permissões identifica a sobreposição decorativa como erro; não há alteração no inspetor para ignorá-la.

O sistema também sinaliza diversidade de tamanhos, em parte resultante dos títulos fluidos e das letras decorativas em escala de cenário. A pequena legenda integrante da marca mantém a proporção do letreiro. Não foi usado vídeo de uma loja ou produto alheio: o movimento solicitado é realizado sobre a moto ilustrativa, e o usuário ainda não possui filmagem dos produtos reais.

Essas decisões não substituem as verificações funcionais. Os conceitos, as imagens e o SVG de marca continuam provisórios. O formulário não transmite dados, e o protótipo não foi publicado em hospedagem externa.
