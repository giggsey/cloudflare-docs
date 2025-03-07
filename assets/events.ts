let SEARCH_ID = /^(Docs|Site)Search/;
let SEARCH_INPUT: HTMLElement;

function $clickaway(ev: MouseEvent) {
  if (SEARCH_INPUT && ev.target !== SEARCH_INPUT) {
    $focus(SEARCH_INPUT, false);
  }
}

export function $focus(elem: HTMLElement, bool: boolean) {
  elem.toggleAttribute("is-focus-visible", bool);
  if (bool) elem.focus();

  // if is topbar search input
  if (SEARCH_ID && SEARCH_ID.test(elem.id)) {
    SEARCH_INPUT = elem;

    elem.parentElement.parentElement.toggleAttribute("is-focused", bool);
    elem.setAttribute("aria-expanded", "" + bool);

    if (bool) addEventListener("click", $clickaway);
    else removeEventListener("click", $clickaway);
  }
}

export function $tabbable(links: NodeListOf<Element>, bool: boolean) {
  for (let i = 0; i < links.length; i++) {
    bool
      ? links[i].removeAttribute("tabindex")
      : links[i].setAttribute("tabindex", "-1");
  }
}

// scroll to section header
// but only on load if `#hash` in URL
export function load() {
  let hash = location.hash.substring(1);
  let item = hash && document.getElementById(hash.toLowerCase());
  let timer =
    item &&
    setInterval(() => {
      if (document.readyState !== "complete") return;
      clearInterval(timer);
      setTimeout(() => {
        item.scrollIntoView({ behavior: "smooth" });
      }, 250);
    }, 10);
}

// mobile sidebar toggle
export function mobile() {
  let root = document.documentElement;
  let btn = document.querySelector(
    ".DocsMobileTitleHeader--sidebar-toggle-button"
  );
  if (btn)
    btn.addEventListener("click", () => {
      root.toggleAttribute("is-mobile-sidebar-open");
    });

  // clicking on mobile search icon
  let input: HTMLInputElement =
    document.querySelector("#DocsSearch--input") ||
    document.querySelector("#SiteSearch--input");

  // register init handler
  if (input)
    input.addEventListener("click", () => {
      $focus(input, true);
    });
}

// add focus attribute to activeElement if keyboard trigger
export function focus() {
  let isTAB = false;
  addEventListener("keydown", (ev) => {
    isTAB = ev.which === 9;
  });

  addEventListener("focusin", (ev) => {
    if (isTAB) $focus(ev.target as HTMLElement, true);
  });

  addEventListener("focusout", (ev) => {
    $focus(ev.target as HTMLElement, false);
  });
}

function $tab(ev: MouseEvent) {
  ev.preventDefault();

  // Get the tabs for this tab block
  const tabBlockId = (ev.target as HTMLElement)
    .closest("[data-id]")
    ?.getAttribute("data-id");

  let tabs = document.querySelectorAll(
    `div[tab-wrapper-id="${tabBlockId}"] > .tab`
  );

  for (let i = 0; i < tabs.length; i++) {
    (tabs[i] as HTMLElement).style.display = "none";
  }

  let link = (ev.target as HTMLElement)
    .closest("[data-link]")
    ?.getAttribute("data-link");

  document.getElementById(`${link}-${tabBlockId}`).style.display = "block";
  zaraz.track("tab click", {selected_option: ev.target.innerText})
}

export function tabs() {
  // Find all tab wrappers
  let wrappers = document.querySelectorAll(".tabs-wrapper");

  addEventListener("DOMContentLoaded", () => {
    for (let i = 0; i < wrappers.length; i++) {
      const labels = wrappers[i].querySelectorAll(".tab-label");
      const tabs = wrappers[i].querySelectorAll(".tab");
      const defaultTab = wrappers[i].querySelector(".tab.tab-default");

      if (tabs.length > 0) {
        // if a tab has been specified as default, set that
        // as active as opposed to defaulting to the first tab
        if (defaultTab) {
          // changes an id (i.e tab-js-esm-6f3904f86f90c21d) into just the type (tab-js-esm)
          // by removing the last element from the split array and then re-joining it
          const parts = defaultTab.id.split("-");
          const tabId = parts.slice(0, parts.length - 1).join("-");

          const defaultTabLabel = wrappers[i].querySelector(
            `a[data-link=${tabId}]`
          );

          (defaultTab as HTMLElement).style.display = "block";
          (defaultTabLabel as HTMLElement).classList.add("active");
        } else {
          (tabs[0] as HTMLElement).style.display = "block";
          (labels[0] as HTMLElement).classList.add("active");
        }

        for (let i = 0; i < labels.length; i++)
          labels[i].addEventListener("click", $tab);
      }
    }
  });
}

export function activeTab() {
  const blocks = document.getElementsByClassName("tab-active");
  if (blocks) {
    for (const block of blocks) {
      const blockId = block.getAttribute("block-id");

      var tabs = block.querySelectorAll(`.tab-label`);
      for (var i = 0; i < tabs.length; i++) {
        (tabs[i] as HTMLElement).addEventListener("click", function name() {
          let current = block.querySelector(`.active`);
          current.classList.remove("active");
          this.classList.add("active");
        });
      }
    }
  }
}

export function dropdowns() {
  let attr = "data-expanded";

  document.querySelectorAll(".Dropdown").forEach((div) => {
    
    let btn = div.querySelector("button");
    let links = div.querySelectorAll<HTMLAnchorElement>("li>a");
    let focused = 0; // index

    if (btn && links.length > 0) {
      let arrows: EventListener = (ev: KeyboardEvent) => {
        let key = ev.which;
        let isTAB = key === 9;

        // ESCAPE ~> close
        if (key === 27) return close(ev);

        // DOWN / TAB ~> next
        if (isTAB || key === 40) focused++;
        // UP / SHIFT+TAB ~> prev
        else if (key === 38 || (isTAB && ev.shiftKey)) focused--;

        // loop focus around menu
        if (focused < 0) focused = links.length;
        else focused %= links.length;

        if (isTAB) ev.preventDefault();
        $focus(links[focused], true);
      };

      let close: EventListener = (ev) => {
        ev.stopPropagation();
        removeEventListener("click", close);

        // tab-inactive sublinks
        $tabbable(links, false);

        div.setAttribute(attr, "false");
        btn.setAttribute(attr, "false");

        div.removeEventListener("keydown", arrows);
      };

      let open: EventListener = (ev) => {
        ev.stopPropagation();
        addEventListener("click", close);

        // tab-friendly sublinks
        $tabbable(links, true);

        div.setAttribute(attr, "true");
        btn.setAttribute(attr, "true");

        // focus the first link
        $focus(links[(focused = 0)], true);

        div.addEventListener("keydown", arrows);
      };

      btn.addEventListener("click", (ev) => {
        if (div.getAttribute(attr) === "true") {
          close(ev);
        } else {
          open(ev);
        }
      });
    }
  });
}

export function toggleSidebar() {
  const toggleButton = document.getElementsByClassName("toggleSidebar");
  if (toggleButton.length > 0) {
    let div = document.querySelector(".DocsSidebar--sections .toggleSidebar");
    let btn = div.querySelector("button");
    btn.addEventListener("click", () => {
      let classToggleList = [
        ".DocsSidebar",
        ".DocsToolbar",
        ".DocsFooter",
        ".DocsContent",
        ".DocsMarkdown",
        ".DocsSidebar--sections .toggleSidebar",
        ".breadcrumb",
      ];

      classToggleList.forEach(function (querySelector) {
        let item = document.querySelector(querySelector);
        item.classList.toggle("collapsed");
      });

      let attr = "is-visually-hidden";
      let attrToggleList = [
        ".DocsSidebar--nav-item",
        ".DocsSidebar--section-more",
        ".DocsSidebar--docs-title-section a div span span",
        ".DocsSidebar--header-section a div span",
      ];

      attrToggleList.forEach(function (querySelector) {
        let item = document.querySelector(querySelector);
        let isHidden = item.hasAttribute(attr);
        item.toggleAttribute(attr, !isHidden);
      });

      let moduleCounters = document.getElementsByClassName("moduleCounter")
      if (moduleCounters) {
        for (const counter of moduleCounters) {
          let isHidden2 = counter.hasAttribute(attr);
          counter.toggleAttribute(attr, !isHidden2)
        }
      }
    });
  }
}

export function zarazTrackDocEvents() {
  const links = document.getElementsByClassName("DocsMarkdown--link");
  const dropdowns = document.getElementsByTagName("details")
  const glossaryTooltips = document.getElementsByClassName("glossary-tooltip")
  const playgroundLinks = document.getElementsByClassName("playground-link")
  addEventListener("DOMContentLoaded", () => {
    if (links.length > 0) {
      for (const link of links as any) {  // Type cast to any for iteration
        if (link.hostname !== "developers.cloudflare.com") {
          if (link.href.includes("workers.cloudflare.com/playground")) {
            link.addEventListener("click", () => {
              $zarazLinkEvent('playground link click', link);
            });
          } else if (link.hostname.includes("cloudflare.com")) {
            link.addEventListener("click", () => {
              $zarazLinkEvent('Cross Domain Click', link);
            });
          } else {
            link.addEventListener("click", () => {
              $zarazLinkEvent('external link click', link);
            });
          }
        }
      }
    }
    if (dropdowns.length > 0) {
      for (const dropdown of dropdowns as any) { 
        dropdown.addEventListener("click", () => {
          $zarazDropdownEvent(dropdown.getElementsByTagName("summary")[0]);
        });
    }
  }
  if (glossaryTooltips.length > 0) {
    for (const tooltip of glossaryTooltips as any) { 
      tooltip.addEventListener("pointerleave", () => {
        $zarazGlossaryTooltipEvent(tooltip.getAttribute('aria-label'))
      });
      tooltip.addEventListener("blur", () => {
        $zarazGlossaryTooltipEvent(tooltip.getAttribute('aria-label'))
      });
  }
}
  if (playgroundLinks.length > 0) {
    for (const playgroundLink of playgroundLinks as any) { 
      playgroundLink.addEventListener("click", () => {
        $zarazLinkEvent('playground link click', playgroundLink);
      });
  }
  }
  });
}

function $zarazLinkEvent(type: string, link: Element) {
  zaraz.track(type, {href: link.href, hostname: link.hostname})
}

function $zarazDropdownEvent(summary: string) {
  zaraz.track('dropdown click', {text: summary.innerText})
}

function $zarazGlossaryTooltipEvent(term: string) {
  zaraz.track('glossary tooltip view', {term: term})
}

export function zarazTrackHomepageLinks() {
  const links = document.getElementsByClassName("DocsMarkdown--link");
  const playgroundLinks = document.getElementsByClassName("playground-link")
  addEventListener("DOMContentLoaded", () => {
    if (links.length > 0) {
      for (const link of links as any) {  // Type cast to any for iteration
        link.addEventListener("click", () => {
          zaraz.track('homepage link click', {href: link.href})
        });
      } 
    }
    if (playgroundLinks.length > 0) {
      for (const playgroundLink of playgroundLinks as any) { 
        playgroundLink.addEventListener("click", () => {
          $zarazLinkEvent('playground link click', playgroundLink);
        });
    }
    }
  });
}