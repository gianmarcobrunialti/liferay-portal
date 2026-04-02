import {mockFrequencyChartData} from "../../../__mocks__";

export default {
    mock: mockFrequencyChartData,
    query: `query VisitFrequency($channelId: String!, $rangeKey: Int) {
    visitFrequency(channelId: $channelId, rangeKey: $rangeKey) {
        visitFrequency {
            count
            name
        },
        totalCount
    }
}`};