"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsightsRecommendationsFlagStrategy = void 0;
const feature_flag_strategy_1 = require("./feature.flag.strategy");
class InsightsRecommendationsFlagStrategy extends feature_flag_strategy_1.FeatureFlagStrategy {
    async calculate(knownFeature, featureConfig) {
        const isInRange = await this.isInTargetRange(featureConfig === null || featureConfig === void 0 ? void 0 : featureConfig.perc);
        return {
            name: knownFeature.name,
            flag: isInRange && await this.filter(featureConfig === null || featureConfig === void 0 ? void 0 : featureConfig.filters) ? !!(featureConfig === null || featureConfig === void 0 ? void 0 : featureConfig.flag) : !(featureConfig === null || featureConfig === void 0 ? void 0 : featureConfig.flag),
        };
    }
}
exports.InsightsRecommendationsFlagStrategy = InsightsRecommendationsFlagStrategy;
