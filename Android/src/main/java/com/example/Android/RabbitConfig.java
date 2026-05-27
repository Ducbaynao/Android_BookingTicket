package com.example.Android.Configs;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;

@Configuration
public class RabbitConfig {

    // RabbitMQ configuration for recommendation service
    // Define the queue, exchange, and binding for recommendation messages
    @Bean
    public Queue queue() {
        return new Queue("recommendationQueue", false);
    }

    @Bean
    public DirectExchange exchange() {
        return new DirectExchange("recommendationExchange");
    }

    @Bean
    public org.springframework.amqp.core.Binding binding(Queue queue, DirectExchange exchange) {
        return BindingBuilder.bind(queue).to(exchange).with("recommendationRoutingKey");
    }

    // RabbitMQ configuration for booking service
    // Define the queue, exchange, and binding for booking messages
    @Bean
    public Queue bookingQueue() {
        return new Queue("bookingQueue", false);
    }

    @Bean
    public DirectExchange bookingExchange() {
        return new DirectExchange("bookingExchange");
    }

    @Bean
    public org.springframework.amqp.core.Binding bookingBinding(Queue bookingQueue, DirectExchange bookingExchange) {
        return BindingBuilder.bind(bookingQueue).to(bookingExchange).with("bookingRoutingKey");
    }
}
