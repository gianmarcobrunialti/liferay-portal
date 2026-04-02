import {mockDocumentsStatisticsData} from "../../../__mocks__";

export default {
    mock: mockDocumentsStatisticsData,
    query: `query DocumentsAndMediaList($channelId: String, $keywords: String, $rangeEnd: String, $rangeKey: Int, $rangeStart: String, $size: Int!, $sort: Sort!, $start: Int!) {
    documents(
        channelId: $channelId
    keywords: $keywords
    rangeEnd: $rangeEnd
    rangeKey: $rangeKey
    rangeStart: $rangeStart
    size: $size
    sort: $sort
    start: $start
) {
        assetMetrics {
        ... on DocumentMetric {
                assetId
                assetTitle
                commentsMetric {
                    value
                    __typename
                }
                downloadsMetric {
                    value
                    __typename
                }
                impressionMadeMetric {
                    value
                    __typename
                }
                lastViewedMetric {
                    value
                    __typename
                }
                ratingsMetric {
                    value
                    __typename
                }
                usersInvolvedMetric {
                    value
                    __typename
                }
                urls
                __typename
            }
            __typename
        }
        total
        __typename
    }
}`};