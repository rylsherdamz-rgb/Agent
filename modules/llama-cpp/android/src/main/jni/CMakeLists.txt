cmake_minimum_required(VERSION 3.18.1)
project(llama-cpp)

set(CMAKE_CXX_STANDARD 17)

add_library(llama-native SHARED
  llama_jni.cpp
)

find_library(log-lib log)

target_include_directories(llama-native PRIVATE ${CMAKE_SOURCE_DIR})

target_link_libraries(llama-native ${log-lib} android)