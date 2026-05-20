describe('Функциональное тестирование: Очистка стилей', () => {

    const transformPastedHTML = (html) => {
        return html
            .replace(/<figcaption[^>]*>[\s\S]*?<\/figcaption>/gi, '')
            .replace(/<\/?u>/gi, '')
            .replace(/text-decoration\s*:\s*underline/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/ style="[^"]*"/gi, "")
            .replace(/ class="[^"]*"/gi, "")
            .replace(/ bgcolor="[^"]*"/gi, "")
            .replace(/ width="[^"]*"/gi, "")
            .replace(/ height="[^"]*"/gi, "")
            .replace(/ valign="[^"]*"/gi, "")
            .replace(/ align="[^"]*"/gi, "")
            .replace(/&nbsp;/gi, " ")
            .replace(/\u00A0/g, " ");
    };

    test('Удаляются избыточные классы и теги стилей', () => {
        const dirtyWordHTML = `
            <div class="WordSection1">
                <p class="MsoNormal" style="margin-bottom: 0in; line-height: normal;">
                    <span style="font-size: 12.0pt; font-family: 'Times New Roman',serif;">
                        Текст из Word&nbsp;
                    </span>
                </p>
                <style>
                    .MsoNormal { color: red; }
                </style>
            </div>
        `;

        const cleanHTML = transformPastedHTML(dirtyWordHTML);

        expect(cleanHTML).not.toContain('class="');
        expect(cleanHTML).not.toContain('style="');
        expect(cleanHTML).not.toContain('<style>');
        expect(cleanHTML).not.toContain('&nbsp;');

        expect(cleanHTML).toContain('<div>');
        expect(cleanHTML).toContain('<p>');
        expect(cleanHTML).toContain('Текст из Word');
    });
});
