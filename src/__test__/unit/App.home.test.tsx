// src/__test__/unit/App.home.test.tsx

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { App } from '../../App';

jest.mock('../../api/ApiClient', () => {
  return {
    ApiClient: jest.fn().mockImplementation(() => ({
      getBooks: jest.fn().mockResolvedValue([]),
      getGames: jest.fn().mockResolvedValue([]),
      getExtracts: jest.fn().mockResolvedValue([]),
      createLevel: jest.fn(),
      getRiddles: jest.fn(),
      finishLevel: jest.fn(),
    })),
  };
});

function renderApp() {
  return render(
    <ChakraProvider value={defaultSystem}>
      <App />
    </ChakraProvider>,
  );
}

test('pokazuje ekran "Home" na starcie', async () => {
  renderApp();

  const headings = await screen.findAllByRole('heading', {
    name: /Polish Literature Language Game/i,
  });

  expect(headings.length).toBeGreaterThanOrEqual(1);
});

test('przejście z "Home" do wyboru gry', async () => {
  renderApp();
  const btn = await screen.findByRole('button', { name: /choose game/i });
  await userEvent.click(btn);

  expect(await screen.findByRole('heading', { name: /choose game/i })).toBeInTheDocument();
});

test('przejście z "Home" do wyboru książki', async () => {
  renderApp();
  const btn = await screen.findByRole('button', { name: /choose book/i });
  await userEvent.click(btn);

  expect(await screen.findByRole('heading', { name: /choose book/i })).toBeInTheDocument();
});
