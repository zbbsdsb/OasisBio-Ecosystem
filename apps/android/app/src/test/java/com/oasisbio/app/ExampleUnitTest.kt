package com.oasisbio.app

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ExampleUnitTest {

    @Test
    fun addition_isCorrect() {
        assertEquals(4, 2 + 2)
    }

    @Test
    fun string_isNotEmpty() {
        val text = "OasisBio"
        assertTrue(text.isNotEmpty())
        assertEquals(8, text.length)
    }

    @Test
    fun list_operations_work() {
        val list = mutableListOf<Int>()
        list.add(1)
        list.add(2)
        list.add(3)
        assertEquals(3, list.size)
        assertEquals(1, list.first())
        assertEquals(3, list.last())
    }

    @Test
    fun map_operations_work() {
        val map = mutableMapOf<String, Int>()
        map["key1"] = 100
        map["key2"] = 200
        assertEquals(2, map.size)
        assertTrue(map.containsKey("key1"))
        assertEquals(100, map["key1"])
    }

    @Test
    fun nullable_handling() {
        var value: String? = null
        assertTrue(value == null)

        value = "test"
        assertTrue(value != null)
        assertEquals("test", value)
    }
}
