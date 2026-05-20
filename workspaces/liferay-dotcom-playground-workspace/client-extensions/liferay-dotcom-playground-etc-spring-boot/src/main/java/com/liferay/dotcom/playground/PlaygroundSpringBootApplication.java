package com.liferay.dotcom.playground;

import com.liferay.client.extension.util.spring.boot3.ClientExtensionUtilSpringBootComponentScan;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Import;

@ComponentScan(basePackages = {"com.liferay.dotcom.playground"})
@Import(ClientExtensionUtilSpringBootComponentScan.class)
@SpringBootApplication
public class PlaygroundSpringBootApplication {

	public static void main(String[] args) {
		SpringApplication.run(PlaygroundSpringBootApplication.class, args);
	}

}
