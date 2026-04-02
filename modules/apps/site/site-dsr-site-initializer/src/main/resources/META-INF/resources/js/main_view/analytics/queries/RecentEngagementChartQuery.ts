import {mockEngagementChartData} from "../../../__mocks__";

export default {
    mock: mockEngagementChartData,
    query: `query SitesMetricQuery($channelId: String, $interval: String!, $rangeEnd: String, $rangeKey: Int, $rangeStart: String) {
    site(
        channelId: $channelId
    interval: $interval
    rangeEnd: $rangeEnd
    rangeKey: $rangeKey
    rangeStart: $rangeStart
) {
        visitorsMetric {
        ...HistogramFragment
            __typename
        }
        __typename
    }
}

fragment HistogramFragment on Metric {
    histogram {
        asymmetricComparison
        metrics {
            key
            value
            valueKey
            __typename
        }
        total
        __typename
    }
    __typename
}`};