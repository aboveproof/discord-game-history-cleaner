(async () => {
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const randomDelay = () => 1200 + Math.random() * 600;

    const visible = element => {
        if (!element) return false;

        const rect = element.getBoundingClientRect();
        return rect.width > 0 &&
            rect.height > 0 &&
            getComputedStyle(element).visibility !== "hidden";
    };

    const exact = (root, selector, label) =>
        [...root.querySelectorAll(selector)].find(element =>
            visible(element) && element.textContent?.trim() === label
        );

    const waitFor = async (callback, timeout = 5000) => {
        const started = Date.now();

        while (Date.now() - started < timeout) {
            const result = callback();
            if (result) return result;
            await sleep(75);
        }

        return null;
    };

    const pressEscape = () => {
        document.dispatchEvent(new KeyboardEvent("keydown", {
            key: "Escape",
            code: "Escape",
            bubbles: true
        }));
    };

    if (!confirm("Permanently clear every entry under Recent activity?")) return;

    const heading = exact(
        document,
        '[role="heading"], h1, h2, h3, div, span',
        "Recent activity"
    );

    if (!heading) {
        throw new Error(
            'Open your profile Activity page so "Recent activity" is visible.'
        );
    }

    let scroller = heading.parentElement;

    while (scroller && scroller !== document.body) {
        const style = getComputedStyle(scroller);

        if (
            /(auto|scroll)/.test(style.overflowY) &&
            scroller.scrollHeight > scroller.clientHeight + 10
        ) {
            break;
        }

        scroller = scroller.parentElement;
    }

    const scope = scroller ?? document;
    if (scroller) scroller.scrollTop = 0;

    const belongsToHistorySection = button => {
        const position = heading.compareDocumentPosition(button);

        return Boolean(position & Node.DOCUMENT_POSITION_FOLLOWING) &&
            button.getBoundingClientRect().top >=
                heading.getBoundingClientRect().bottom - 1;
    };

    const findHistoryMenuButtons = () =>
        [...scope.querySelectorAll('button, [role="button"]')]
            .filter(button => {
                if (!visible(button) || !belongsToHistorySection(button)) {
                    return false;
                }

                const label = button.getAttribute("aria-label") ?? "";
                const text = button.textContent?.trim() ?? "";

                return /\b(more|options)\b/i.test(label) ||
                    /^(\.{3}|…|⋯)$/.test(text);
            });

    window.__stopClearGameHistory = false;
    let cleared = 0;

    console.log(
        "Clearing Recent activity only. " +
        "Run window.__stopClearGameHistory = true to stop."
    );

    while (!window.__stopClearGameHistory) {
        let removed = false;

        for (const menuButton of findHistoryMenuButtons()) {
            if (window.__stopClearGameHistory) break;

            menuButton.click();

            const menu = await waitFor(() =>
                [...document.querySelectorAll('[role="menu"]')]
                    .filter(visible)
                    .find(element =>
                        exact(
                            element,
                            '[role="menuitem"], [role="menuitemradio"]',
                            "Clear Game History"
                        )
                    )
            );

            if (!menu) {
                pressEscape();
                await sleep(150);
                continue;
            }

            const clearHistoryItem = exact(
                menu,
                '[role="menuitem"], [role="menuitemradio"]',
                "Clear Game History"
            );

            if (!clearHistoryItem) {
                pressEscape();
                continue;
            }

            clearHistoryItem.click();

            const confirmation = await waitFor(() => {
                const title = exact(
                    document,
                    '[role="heading"], h1, h2, h3',
                    "Clear Game History"
                );

                return title?.closest('[role="dialog"]') ?? null;
            });

            if (!confirmation) {
                pressEscape();
                console.warn(
                    "Discord did not open the confirmation. Stopping safely."
                );
                window.__stopClearGameHistory = true;
                break;
            }

            const clearButton = exact(
                confirmation,
                'button, [role="button"]',
                "Clear"
            );

            if (!clearButton) {
                pressEscape();
                console.warn(
                    "Confirmation button was not found. Stopping safely."
                );
                window.__stopClearGameHistory = true;
                break;
            }

            clearButton.click();

            const closed = await waitFor(() => !visible(confirmation), 7000);

            if (!closed) {
                console.warn(
                    "Discord did not finish the removal. " +
                    "Stopping in case of a rate limit."
                );
                window.__stopClearGameHistory = true;
                break;
            }

            cleared++;
            removed = true;
            console.log(
                `Cleared ${cleared} history entr${cleared === 1 ? "y" : "ies"}.`
            );

            await sleep(randomDelay());
            break;
        }

        if (removed) continue;
        if (!scroller) break;

        const before = scroller.scrollTop;
        const maximum = scroller.scrollHeight - scroller.clientHeight;

        scroller.scrollTop = Math.min(
            maximum,
            before + Math.max(300, scroller.clientHeight * 0.75)
        );

        await sleep(500);

        if (scroller.scrollTop === before) break;
    }

    console.log(
        window.__stopClearGameHistory
            ? `Stopped after ${cleared} removals.`
            : `Finished. Cleared ${cleared} history entries.`
    );
})();
