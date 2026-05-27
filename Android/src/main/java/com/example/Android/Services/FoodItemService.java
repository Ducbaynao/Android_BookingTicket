package com.example.Android.Services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.Android.Models.FoodItem;
import com.example.Android.Repositories.FoodItemRepository;

@Service
public class FoodItemService {
    
    @Autowired
    private FoodItemRepository foodItemRepository;
    
    public List<FoodItem> getAllFoodItems() {
        return foodItemRepository.findAll();
    }
    
    public List<FoodItem> getAvailableFoodItems() {
        return foodItemRepository.findByAvailableTrue();
    }
    
    public List<FoodItem> getFoodItemsByCategory(String category) {
        return foodItemRepository.findByCategoryAndAvailableTrue(category, true);
    }
    
    public FoodItem getFoodItemById(Long id) {
        return foodItemRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Food item not found with id: " + id));
    }
    
    public FoodItem createFoodItem(FoodItem foodItem) {
        return foodItemRepository.save(foodItem);
    }
    
    public FoodItem updateFoodItem(Long id, FoodItem foodItemDetails) {
        FoodItem foodItem = getFoodItemById(id);
        foodItem.setName(foodItemDetails.getName());
        foodItem.setCategory(foodItemDetails.getCategory());
        foodItem.setPrice(foodItemDetails.getPrice());
        foodItem.setDescription(foodItemDetails.getDescription());
        foodItem.setImageUrl(foodItemDetails.getImageUrl());
        foodItem.setAvailable(foodItemDetails.getAvailable());
        return foodItemRepository.save(foodItem);
    }
    
    public void deleteFoodItem(Long id) {
        FoodItem foodItem = getFoodItemById(id);
        foodItemRepository.delete(foodItem);
    }
}
