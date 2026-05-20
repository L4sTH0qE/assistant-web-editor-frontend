import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { TextBlock } from './TextBlock';
import { vi } from 'vitest';

if (typeof global.ResizeObserver === 'undefined') {
    global.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
}

describe('Функциональное тестирование: Контроль блока с изображением', () => {
    test('Отрисовывает красный оверлей если изображение превышает ширину контейнера', async () => {
        const mockContent = '<p>Текст</p><img src="test.jpg" alt="Большая картинка" />';
        const { container } = render(<TextBlock content={mockContent} />);

        const wrapperEl = container.firstChild;
        const imgEl = container.querySelector('img');

        imgEl.removeAttribute('width');
        imgEl.style.width = '';

        vi.spyOn(wrapperEl, 'getBoundingClientRect').mockReturnValue({
            width: 600, top: 0, left: 0, right: 600, bottom: 100,
        });
        vi.spyOn(imgEl, 'getBoundingClientRect').mockReturnValue({
            width: 800, height: 400, top: 50, left: 0, right: 800, bottom: 450,
        });

        act(() => {
            const loadEvent = new Event('load');
            imgEl.dispatchEvent(loadEvent);
        });

        await waitFor(() => {
            expect(screen.getByText(/Ширина изображения \(800px\) превышает ширину страницы/i)).toBeInTheDocument();
        });

        const warningOverlay = container.querySelector('div[style*="repeating-linear-gradient"]');
        expect(warningOverlay).toBeInTheDocument();
    });
});
