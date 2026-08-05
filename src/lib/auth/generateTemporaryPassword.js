import { randomInt } from 'node:crypto';

function chooseCharacter(characters) {
  return characters[randomInt(0, characters.length)];
}

function shuffleCharacters(characters) {
  const result = [...characters];

  for (
    let index = result.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomIndex = randomInt(0, index + 1);

    [result[index], result[randomIndex]] = [
      result[randomIndex],
      result[index],
    ];
  }

  return result;
}

export function generateTemporaryPassword(length = 18) {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%&*_-+?';
  const allCharacters =
    uppercase + lowercase + numbers + symbols;

  const passwordCharacters = [
    chooseCharacter(uppercase),
    chooseCharacter(lowercase),
    chooseCharacter(numbers),
    chooseCharacter(symbols),
  ];

  while (passwordCharacters.length < length) {
    passwordCharacters.push(
      chooseCharacter(allCharacters)
    );
  }

  return shuffleCharacters(passwordCharacters).join('');
}
