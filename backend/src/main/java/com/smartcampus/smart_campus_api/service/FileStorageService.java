package com.smartcampus.smart_campus_api.service;

import com.smartcampus.smart_campus_api.exception.BadRequestException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final int MAX_IMAGES = 3;
    private static final Set<String> ALLOWED_EXT = Set.of(".jpg", ".jpeg", ".png", ".gif", ".webp");

    private final Path ticketsRoot;

    public FileStorageService(@Value("${app.upload.dir:uploads}") String uploadDir) {
        this.ticketsRoot = Paths.get(uploadDir).resolve("tickets").toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() throws IOException {
        Files.createDirectories(ticketsRoot);
    }

    public List<String> storeTicketImages(MultipartFile[] files) {
        if (files == null || files.length == 0) {
            return List.of();
        }
        if (files.length > MAX_IMAGES) {
            throw new BadRequestException("A maximum of " + MAX_IMAGES + " images is allowed");
        }
        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }
            String ext = extensionOf(file.getOriginalFilename());
            if (!ALLOWED_EXT.contains(ext)) {
                throw new BadRequestException("Only JPG, PNG, GIF, or WEBP images are allowed");
            }
            if (file.getSize() > 5 * 1024 * 1024) {
                throw new BadRequestException("Each image must be 5MB or smaller");
            }
            String filename = UUID.randomUUID() + ext;
            Path dest = ticketsRoot.resolve(filename);
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException e) {
                throw new BadRequestException("Could not store image");
            }
            urls.add("/api/files/tickets/" + filename);
        }
        return urls;
    }

    private static String extensionOf(String original) {
        if (original == null || !original.contains(".")) {
            return "";
        }
        return original.substring(original.lastIndexOf('.')).toLowerCase(Locale.ROOT);
    }
}
