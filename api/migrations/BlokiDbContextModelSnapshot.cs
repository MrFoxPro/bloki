﻿// <auto-generated />
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

#nullable disable

namespace bloki.migrations
{
    [DbContext(typeof(BlokiDbContext))]
    partial class BlokiDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder.HasAnnotation("ProductVersion", "6.0.4");

            modelBuilder.Entity("Block", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<int>("DocumentId")
                        .HasColumnType("INTEGER");

                    b.Property<int>("Height")
                        .HasColumnType("INTEGER");

                    b.Property<int>("Width")
                        .HasColumnType("INTEGER");

                    b.Property<int>("X")
                        .HasColumnType("INTEGER");

                    b.Property<int>("Y")
                        .HasColumnType("INTEGER");

                    b.Property<int>("type")
                        .HasColumnType("INTEGER");

                    b.HasKey("Id");

                    b.HasIndex("DocumentId");

                    b.ToTable("Block");

                    b.HasDiscriminator<int>("type");
                });

            modelBuilder.Entity("Document", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<byte[]>("Blob")
                        .IsRequired()
                        .HasColumnType("BLOB");

                    b.Property<bool>("Shared")
                        .HasColumnType("INTEGER");

                    b.Property<string>("Title")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<int>("WorkspaceId")
                        .HasColumnType("INTEGER");

                    b.HasKey("Id");

                    b.HasIndex("WorkspaceId");

                    b.ToTable("Documents");
                });

            modelBuilder.Entity("User", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<string>("GridRenderMethod")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<string>("Locale")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<int>("SelectedDocumentId")
                        .HasColumnType("INTEGER");

                    b.Property<int>("SelectedWorkspaceId")
                        .HasColumnType("INTEGER");

                    b.HasKey("Id");

                    b.HasIndex("SelectedDocumentId");

                    b.HasIndex("SelectedWorkspaceId");

                    b.ToTable("Users");
                });

            modelBuilder.Entity("UserWorkspace", b =>
                {
                    b.Property<int>("UsersId")
                        .HasColumnType("INTEGER");

                    b.Property<int>("WorkspacesId")
                        .HasColumnType("INTEGER");

                    b.HasKey("UsersId", "WorkspacesId");

                    b.HasIndex("WorkspacesId");

                    b.ToTable("UserWorkspace");
                });

            modelBuilder.Entity("Workspace", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<string>("Title")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.HasKey("Id");

                    b.ToTable("Workspaces");
                });

            modelBuilder.Entity("CodeBlock", b =>
                {
                    b.HasBaseType("Block");

                    b.HasDiscriminator().HasValue(3);
                });

            modelBuilder.Entity("ImageBlock", b =>
                {
                    b.HasBaseType("Block");

                    b.Property<string>("Url")
                        .HasColumnType("TEXT");

                    b.HasDiscriminator().HasValue(2);
                });

            modelBuilder.Entity("TextBlock", b =>
                {
                    b.HasBaseType("Block");

                    b.Property<int>("FontFamily")
                        .HasColumnType("INTEGER");

                    b.Property<int>("TextType")
                        .HasColumnType("INTEGER");

                    b.Property<string>("Value")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.HasDiscriminator().HasValue(1);
                });

            modelBuilder.Entity("Block", b =>
                {
                    b.HasOne("Document", null)
                        .WithMany("Layout")
                        .HasForeignKey("DocumentId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("Document", b =>
                {
                    b.HasOne("Workspace", null)
                        .WithMany("Documents")
                        .HasForeignKey("WorkspaceId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.OwnsOne("LayoutOptions", "LayoutOptions", b1 =>
                        {
                            b1.Property<int>("DocumentId")
                                .HasColumnType("INTEGER");

                            b1.Property<int>("FGridHeight")
                                .HasColumnType("INTEGER");

                            b1.Property<int>("FGridWidth")
                                .HasColumnType("INTEGER");

                            b1.Property<int>("Gap")
                                .HasColumnType("INTEGER");

                            b1.Property<int>("MGridHeight")
                                .HasColumnType("INTEGER");

                            b1.Property<int>("MGridWidth")
                                .HasColumnType("INTEGER");

                            b1.Property<bool>("ShowGridGradient")
                                .HasColumnType("INTEGER");

                            b1.Property<bool>("ShowResizeAreas")
                                .HasColumnType("INTEGER");

                            b1.Property<int>("Size")
                                .HasColumnType("INTEGER");

                            b1.HasKey("DocumentId");

                            b1.ToTable("Documents");

                            b1.WithOwner()
                                .HasForeignKey("DocumentId");
                        });

                    b.Navigation("LayoutOptions")
                        .IsRequired();
                });

            modelBuilder.Entity("User", b =>
                {
                    b.HasOne("Document", null)
                        .WithMany()
                        .HasForeignKey("SelectedDocumentId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("Workspace", null)
                        .WithMany()
                        .HasForeignKey("SelectedWorkspaceId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("UserWorkspace", b =>
                {
                    b.HasOne("User", null)
                        .WithMany()
                        .HasForeignKey("UsersId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("Workspace", null)
                        .WithMany()
                        .HasForeignKey("WorkspacesId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("Document", b =>
                {
                    b.Navigation("Layout");
                });

            modelBuilder.Entity("Workspace", b =>
                {
                    b.Navigation("Documents");
                });
#pragma warning restore 612, 618
        }
    }
}
