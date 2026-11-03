(async () => {
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const randomDelay = () => 1200 + Math.random() * 600;

    const visible = element => {
        if (!element?.isConnected) return false;

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
            if (window.__stopClearGameHistory) return null;

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

    const getRecentActivityHeading = () => exact(
        document,
        '[role="heading"], h1, h2, h3, div, span',
        "Recent activity"
    );

    const getScroller = heading => {
        let element = heading.parentElement;

        while (element && element !== document.body) {
            const style = getComputedStyle(element);

            if (
                /(auto|scroll)/.test(style.overflowY) &&
                element.scrollHeight > element.clientHeight + 10
            ) {
                return element;
            }

            element = element.parentElement;
        }

        return null;
    };

    const getFullProfile = () => {
        const title = exact(
            document,
            '[role="heading"], h1, h2, h3',
            "Your full profile"
        );

        if (title) return title.closest('[role="dialog"]');

        return [...document.querySelectorAll('[role="dialog"]')]
            .filter(visible)
            .find(dialog => exact(dialog, '[role="tab"]', "Activity")) ?? null;
    };

    const selectActivityTab = async () => {
        const profile = getFullProfile();
        if (!profile) return null;

        const activityTab = exact(
            profile,
            '[role="tab"], button, [role="button"]',
            "Activity"
        );

        activityTab?.click();
        return await waitFor(getRecentActivityHeading, 8000);
    };

    const closeProfileUi = async () => {
        const profile = getFullProfile();
        const closeButton = profile && (
            profile.querySelector('button[aria-label="Close"]') ||
            exact(profile, 'button, [role="button"]', "Close")
        );

        if (closeButton) closeButton.click();
        pressEscape();
        await sleep(300);
    };

    const openFullProfileFromAccountPanel = async () => {
        const accountRegion = document.querySelector(
            '[aria-label="User status and settings"]'
        );
        const accountScope = accountRegion ?? document;
        const accountButton = [...accountScope.querySelectorAll('button, [role="button"]')]
            .find(element =>
                visible(element) &&
                /^(Manage profile and status|Set Status|User Profile)$/i.test(
                    element.getAttribute("aria-label") ?? ""
                )
            );

        if (!accountButton) return null;

        const existingElements = new Set(document.querySelectorAll("*"));
        const accountRect = accountButton.getBoundingClientRect();
        accountButton.click();
        await sleep(700);

        const directProfile = getFullProfile();
        if (directProfile) return directProfile;

        const avatar = [...document.querySelectorAll('img, [role="img"]')]
            .filter(element => {
                if (existingElements.has(element) || !visible(element)) return false;

                const rect = element.getBoundingClientRect();
                const square = Math.abs(rect.width - rect.height) <= 20;
                const insideAccountColumn = rect.left >= accountRect.left &&
                    rect.right <= accountRect.right;

                return square &&
                    insideAccountColumn &&
                    rect.top < accountRect.top &&
                    rect.width >= 48 &&
                    rect.width <= 140;
            })
            .sort((left, right) => {
                const a = left.getBoundingClientRect();
                const b = right.getBoundingClientRect();
                return b.width * b.height - a.width * a.height || a.top - b.top;
            })[0];

        if (!avatar) return null;

        const avatarButton = avatar.closest(
            'button, [role="button"], [tabindex="0"]'
        );

        (avatarButton ?? avatar).click();
        return await waitFor(getFullProfile, 5000);
    };

    const openActivityView = async force => {
        if (force) await closeProfileUi();

        const currentHeading = getRecentActivityHeading();
        if (currentHeading) return currentHeading;

        if (getFullProfile()) return await selectActivityTab();

        const profile = await openFullProfileFromAccountPanel();
        if (!profile) return null;

        return await selectActivityTab();
    };

    const ensureActivityView = async force => {
        let heading = force ? null : getRecentActivityHeading();

        while (!heading && !window.__stopClearGameHistory) {
            console.log("Opening your profile Activity tab…");
            heading = await openActivityView(force);
            force = true;

            if (!heading) {
                console.warn("Activity did not open. Retrying in 2 seconds.");
                await sleep(2000);
            }
        }

        if (!heading) return null;

        const scroller = getScroller(heading);
        return { heading, scroller, scope: scroller ?? document };
    };

    const findHistoryMenuButtons = ({ heading, scope }) =>
        [...scope.querySelectorAll('button, [role="button"]')]
            .filter(button => {
                if (!visible(button)) return false;

                const position = heading.compareDocumentPosition(button);
                const afterHeading = Boolean(
                    position & Node.DOCUMENT_POSITION_FOLLOWING
                );
                const belowHeading = button.getBoundingClientRect().top >=
                    heading.getBoundingClientRect().bottom - 1;

                if (!afterHeading || !belowHeading) return false;

                const label = button.getAttribute("aria-label") ?? "";
                const text = button.textContent?.trim() ?? "";

                return /\b(more|options)\b/i.test(label) ||
                    /^(\.{3}|…|⋯)$/.test(text);
            });

    const findClearMenu = () =>
        [...document.querySelectorAll('[role="menu"]')]
            .filter(visible)
            .find(menu => exact(
                menu,
                '[role="menuitem"], [role="menuitemradio"]',
                "Clear Game History"
            ));

    const findConfirmation = () =>
        [...document.querySelectorAll('[role="dialog"]')]
            .filter(dialog =>
                visible(dialog) &&
                dialog.textContent?.includes("Clear Game History") &&
                exact(dialog, 'button, [role="button"]', "Clear")
            )
            .sort((left, right) => {
                const a = left.getBoundingClientRect();
                const b = right.getBoundingClientRect();
                return a.width * a.height - b.width * b.height;
            })[0] ?? null;

    if (!confirm("Permanently clear every entry under Recent activity?")) return;

    window.__stopClearGameHistory = false;
    let cleared = 0;
    let view = await ensureActivityView(true);

    console.log(
        "Clearing Recent activity only. " +
        "Run window.__stopClearGameHistory = true to stop."
    );

    while (!window.__stopClearGameHistory) {
        if (!view || !visible(view.heading)) {
            view = await ensureActivityView(false);
            continue;
        }

        let removed = false;
        let recover = false;
        const menuButtons = findHistoryMenuButtons(view);

        for (const menuButton of menuButtons) {
            if (window.__stopClearGameHistory) break;

            menuButton.click();

            const menu = await waitFor(findClearMenu, 2500);

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

            clearHistoryItem.click();

            const confirmation = await waitFor(findConfirmation, 5000);

            if (!confirmation) {
                if (window.__stopClearGameHistory) break;

                pressEscape();
                console.warn(
                    "Confirmation was interrupted. Reopening Activity and continuing."
                );
                recover = true;
                break;
            }

            const clearButton = exact(
                confirmation,
                'button, [role="button"]',
                "Clear"
            );

            clearButton.click();

            const closed = await waitFor(
                () => !visible(confirmation),
                7000
            );

            if (!closed) {
                if (window.__stopClearGameHistory) break;

                pressEscape();
                console.warn(
                    "Removal did not finish. Waiting 5 seconds before retrying."
                );
                await sleep(5000);
                recover = true;
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

        if (recover) {
            view = await ensureActivityView(true);
            continue;
        }

        if (!view.scroller) break;

        const before = view.scroller.scrollTop;
        const maximum = view.scroller.scrollHeight - view.scroller.clientHeight;

        view.scroller.scrollTop = Math.min(
            maximum,
            before + Math.max(300, view.scroller.clientHeight * 0.75)
        );

        await sleep(500);

        if (view.scroller.scrollTop === before) break;
    }

    console.log(
        window.__stopClearGameHistory
            ? `Stopped after ${cleared} removals.`
            : `Finished. Cleared ${cleared} history entries.`
    );
})();
