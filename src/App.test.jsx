import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from './store';
import App from './App';

const mockUserAgent = (userAgentString) => {
    Object.defineProperty(window.navigator, 'userAgent', {
        value: userAgentString,
        configurable: true,
    });
};

describe('Функциональное тестирование: Мобильная заглушка', () => {
    const originalUserAgent = navigator.userAgent;

    afterEach(() => {
        mockUserAgent(originalUserAgent);
    });

    test('Открывается экран-заглушка при заходе с мобильного устройства (iPhone)', () => {
        mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15');

        render(
            <Provider store={store}>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </Provider>
        );

        expect(screen.getByText('Упс... Мобильная версия не поддерживается')).toBeInTheDocument();
        expect(screen.getByText(/Пожалуйста, откройте приложение с компьютера или ноутбука/i)).toBeInTheDocument();
    });

    test('Не показывается экран-заглушка при заходе с десктопа (Windows NT)', () => {
        mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

        const { container } = render(
            <Provider store={store}>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </Provider>
        );

        expect(screen.queryByText('Упс... Мобильная версия не поддерживается')).not.toBeInTheDocument();
    });
});
