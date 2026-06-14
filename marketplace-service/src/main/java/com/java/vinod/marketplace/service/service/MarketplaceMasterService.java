package com.java.vinod.marketplace.service.service;

import com.java.vinod.marketplace.service.dto.MarketplaceDtos;
import com.java.vinod.marketplace.service.entity.CountryFeatureMapping;
import com.java.vinod.marketplace.service.entity.DeliveryTypeMaster;
import com.java.vinod.marketplace.service.entity.FeatureMaster;
import com.java.vinod.marketplace.service.entity.FeeTypeMaster;
import com.java.vinod.marketplace.service.entity.ListingConditionMaster;
import com.java.vinod.marketplace.service.entity.SubcategoryMaster;
import com.java.vinod.marketplace.service.repository.CountryFeatureMappingRepository;
import com.java.vinod.marketplace.service.repository.DeliveryTypeMasterRepository;
import com.java.vinod.marketplace.service.repository.FeatureMasterRepository;
import com.java.vinod.marketplace.service.repository.FeeTypeMasterRepository;
import com.java.vinod.marketplace.service.repository.ListingConditionMasterRepository;
import com.java.vinod.marketplace.service.repository.SubcategoryMasterRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MarketplaceMasterService {
    private final SubcategoryMasterRepository subcategoryMasterRepository;
    private final FeatureMasterRepository featureMasterRepository;
    private final CountryFeatureMappingRepository countryFeatureMappingRepository;
    private final ListingConditionMasterRepository listingConditionMasterRepository;
    private final DeliveryTypeMasterRepository deliveryTypeMasterRepository;
    private final FeeTypeMasterRepository feeTypeMasterRepository;

    public MarketplaceMasterService(SubcategoryMasterRepository subcategoryMasterRepository,
                                    FeatureMasterRepository featureMasterRepository,
                                    CountryFeatureMappingRepository countryFeatureMappingRepository,
                                    ListingConditionMasterRepository listingConditionMasterRepository,
                                    DeliveryTypeMasterRepository deliveryTypeMasterRepository,
                                    FeeTypeMasterRepository feeTypeMasterRepository) {
        this.subcategoryMasterRepository = subcategoryMasterRepository;
        this.featureMasterRepository = featureMasterRepository;
        this.countryFeatureMappingRepository = countryFeatureMappingRepository;
        this.listingConditionMasterRepository = listingConditionMasterRepository;
        this.deliveryTypeMasterRepository = deliveryTypeMasterRepository;
        this.feeTypeMasterRepository = feeTypeMasterRepository;
    }

    @Transactional(readOnly = true)
    public List<MarketplaceDtos.SubcategoryResponse> subcategories(String categoryCode, String countryCode) {
        List<SubcategoryMaster> items;
        if (categoryCode != null && !categoryCode.isBlank() && countryCode != null && !countryCode.isBlank()) {
            items = subcategoryMasterRepository.findByActiveTrueAndCategoryCodeAndCountryCodeOrderByDisplayOrderAscSubcategoryNameAsc(
                    categoryCode.trim().toUpperCase(), countryCode.trim().toUpperCase());
        } else if (categoryCode != null && !categoryCode.isBlank()) {
            items = subcategoryMasterRepository.findByActiveTrueAndCategoryCodeAndCountryCodeIsNullOrderByDisplayOrderAscSubcategoryNameAsc(
                    categoryCode.trim().toUpperCase());
        } else if (countryCode != null && !countryCode.isBlank()) {
            items = subcategoryMasterRepository.findByActiveTrueAndCountryCodeOrderByDisplayOrderAscSubcategoryNameAsc(countryCode.trim().toUpperCase());
        } else {
            items = subcategoryMasterRepository.findByActiveTrueOrderByDisplayOrderAscSubcategoryNameAsc();
        }
        return items.stream().map(this::toSubcategory).toList();
    }

    @Transactional(readOnly = true)
    public List<MarketplaceDtos.FeatureResponse> features(String countryCode) {
        List<FeatureMaster> activeFeatures = featureMasterRepository.findByActiveTrueOrderBySortOrderAscDisplayLabelAsc();
        if (countryCode == null || countryCode.isBlank()) {
            return activeFeatures.stream().map(this::toFeature).toList();
        }
        List<String> enabledCodes = countryFeatureMappingRepository
                .findByCountryCodeAndEnabledTrueOrderBySortOrderAsc(countryCode.trim().toUpperCase())
                .stream().map(CountryFeatureMapping::getFeatureCode).toList();
        return activeFeatures.stream()
                .filter(feature -> enabledCodes.isEmpty() || enabledCodes.contains(feature.getFeatureCode()))
                .map(this::toFeature)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MarketplaceDtos.ListingConditionResponse> listingConditions() {
        return listingConditionMasterRepository.findByActiveTrueOrderBySortOrderAscDisplayLabelAsc().stream()
                .map(this::toListingCondition)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MarketplaceDtos.DeliveryTypeResponse> deliveryTypes() {
        return deliveryTypeMasterRepository.findByActiveTrueOrderBySortOrderAscDisplayLabelAsc().stream()
                .map(this::toDeliveryType)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MarketplaceDtos.FeeTypeResponse> feeTypes() {
        return feeTypeMasterRepository.findByActiveTrueOrderBySortOrderAscDisplayLabelAsc().stream()
                .map(this::toFeeType)
                .toList();
    }

    private MarketplaceDtos.SubcategoryResponse toSubcategory(SubcategoryMaster value) {
        return new MarketplaceDtos.SubcategoryResponse(value.getId(), value.getSubcategoryCode(), value.getCategoryCode(),
                value.getSubcategoryName(), value.getSubcategorySlug(), value.getIconRef(), value.getCountryCode(), value.isActive());
    }

    private MarketplaceDtos.FeatureResponse toFeature(FeatureMaster value) {
        return new MarketplaceDtos.FeatureResponse(value.getFeatureCode(), value.getDisplayLabel(), value.getDescription(),
                value.isActive(), value.getSortOrder());
    }

    private MarketplaceDtos.ListingConditionResponse toListingCondition(ListingConditionMaster value) {
        return new MarketplaceDtos.ListingConditionResponse(value.getConditionCode(), value.getDisplayLabel(),
                value.getDescription(), value.isActive(), value.getSortOrder());
    }

    private MarketplaceDtos.DeliveryTypeResponse toDeliveryType(DeliveryTypeMaster value) {
        return new MarketplaceDtos.DeliveryTypeResponse(value.getDeliveryTypeCode(), value.getDisplayLabel(),
                value.getDescription(), value.isDigitalDelivery(), value.isActive(), value.getSortOrder());
    }

    private MarketplaceDtos.FeeTypeResponse toFeeType(FeeTypeMaster value) {
        return new MarketplaceDtos.FeeTypeResponse(value.getFeeTypeCode(), value.getDisplayLabel(), value.getDescription(),
                value.getFeeBasis(), value.getRatePercentage(), value.isActive(), value.getSortOrder());
    }
}
