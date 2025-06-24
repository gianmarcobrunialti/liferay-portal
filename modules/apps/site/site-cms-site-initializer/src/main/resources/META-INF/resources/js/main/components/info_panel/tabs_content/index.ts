import CategorizationTabContent from "./CategorizationTabContent";
import DetailsTabContent from "./DetailsTabContent";
import PerformanceTabContent from "./PerformanceTabContent";
import VersionsTabContent from "./VersionsTabContent";

export const TABS = {
    DETAILS: {
        component: DetailsTabContent,
        id: 'details',
        name: Liferay.Language.get('details'),
    },
    CATEGORIZATION: {
        component: CategorizationTabContent,
        id: 'categorization',
        name: Liferay.Language.get('categorization'),
    },
    PERFORMANCE: {
        component: PerformanceTabContent,
        id: 'performance',
        name: Liferay.Language.get('performance'),
    },
    VERSIONS: {
        component: VersionsTabContent,
        id: 'versions',
        name: Liferay.Language.get('versions'),
    },
}