(async () => {
	const downloadButtonId = '65cc5d095a58054d910b2b63';

	function findByXPath(xpath) {
		return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
	}

	function isAllurePageLoaded() {
		const allureLogoButton = '//a[@class="SideMenu__logo" and @title="allure" and @data-testid="link__logo"]';
		return null !== findByXPath(allureLogoButton);
	}

	function isLaunchPageLoaded() {
		const launchesBreadcrumb = '//div[@class="LaunchHeader"]/div[@class="BreadCrumbs "]/a[@title="Launches"]';
		return null !== findByXPath(launchesBreadcrumb);
	}

	function repeatUntil(callback, interval) {
		return new Promise((resolve, reject) => {
			if (callback()) {
				return;
			}

			const subscription = window.setInterval(
				() => {
					if (callback()) {
						window.clearInterval(subscription);
						resolve();
					}
				},
				interval ?? 1000);
		});
	}

	function waitCondition(condition, timeout, interval) {
		return new Promise((resolve, reject) => {
			const conditionResult = condition();
			if (conditionResult) {
				resolve(conditionResult);
				return;
			}
	
			timeout ??= 10000;
			interval ??= 100;
	
			const subscription = window.setInterval(
				() => {
					const conditionResult = condition();
					if (conditionResult) {
						window.clearInterval(subscription);
						resolve(conditionResult);
						return;
					}
	
					timeout -= interval;
	
					if (timeout <= 0) {
						window.clearInterval(subscription);
						resolve(conditionResult);
					}
				},
				interval);
			});
	}

	function isDownloadButtonAdded() {
		return null !== document.getElementById(downloadButtonId);
	}

	function addDownloadButton() {
		const launchButtonsContainerXpath = '//div[@class="LaunchHeader"]/div[@class="Gapped Gapped_small Gapped_align_center "]';
		const launchButtonsContainer = findByXPath(launchButtonsContainerXpath);

		if (launchButtonsContainer !== null) {
			const button = document.createElement('button');
			button.id = downloadButtonId;
			button.type = 'button';
			button.title = 'Download VS test playlist';
			button.className = 'Button Button_size_tiny Button_style_default Button_shape_round ';
			button.innerHTML = '<svg class="Icon Icon_size_small Button__icon Button__icon_size_tiny" viewBox="0 0 32 32" name=""><use xlink:href="#list-dropdown"></use></svg>';
	
			launchButtonsContainer.prepend(button);
		}
	}

	if (await waitCondition(isAllurePageLoaded)) {
		console.log('Allure extension loaded');

		const allurePageMaxUnloadedCount = 5;
		var allurePageUnloadedCount = 0;

		await repeatUntil(() => {
			if (isAllurePageLoaded()) {
				allurePageUnloadedCount = 0;
			} else {
				allurePageUnloadedCount++;

				if (allurePageUnloadedCount >= allurePageMaxUnloadedCount) {
					return true;
				}
			}

			if (!isDownloadButtonAdded() && isLaunchPageLoaded()) {
				addDownloadButton();
			}
		});

		console.log('Allure extension unloaded')
	}
})();

