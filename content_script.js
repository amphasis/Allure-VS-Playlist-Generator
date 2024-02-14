(async () => {
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

	function tryInsertDownloadButton() {
		const launchButtonsContainerXpath = '//div[@class="LaunchHeader"]/div[@class="Gapped Gapped_small Gapped_align_center "]';
		const launchButtonsContainer = findByXPath(launchButtonsContainerXpath);

		if (launchButtonsContainer === null) {
			return false;
		}

		// <button class="Button Button_size_small Button_style_default Button_shape_round " type="button"><svg class="Icon Icon_size_small Button__icon Button__icon_size_small" viewBox="0 0 32 32" name=""><use xlink:href="#list-dropdown"></use></svg></button>
	}

	if (await waitCondition(isAllurePageLoaded)) {
		console.log('Allure extension loaded');

		const allurePageMaxUnloadedCount = 5;
		var allurePageUnloadedCount = 0;
		var wasLaunchPageLoaded = false;

		await repeatUntil(() => {
			if (isAllurePageLoaded()) {
				allurePageUnloadedCount = 0;
			} else {
				allurePageUnloadedCount++;
				
				if (allurePageUnloadedCount >= allurePageMaxUnloadedCount) {
					return true;
				}
			}
		
			if (isLaunchPageLoaded() == wasLaunchPageLoaded) {
				return;
			}

			wasLaunchPageLoaded = !wasLaunchPageLoaded;

			if (wasLaunchPageLoaded) {
				console.log('Launch page loaded')
			}
		});

		console.log('Allure extension unloaded')
	}
})();

