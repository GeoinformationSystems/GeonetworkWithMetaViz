MetaViz is a web client that visually illustrates the relations between numerical models/simulations and their corresponding in- and output data. GeoNetwork is an OpenSource metadata catalog, which has been extended with MetaViz scripts. Users of this extended catalog can interactively navigate through the lineage of datasets that are stored in the catalog.

With METAVIZ the provenance of a dataset is represented as a tree‐like graph that connects the dataset to the process it originates from as well as the source datasets of these processes (white boxes).Other relevant metadata of the dataset, such as parent‐child‐relationships to other datasets and data series, publication references and in particular quality information is listed next to the visualization. The focus of the visualization can be either on an
input dataset, a numerical model or an output dataset, such that the use of a dataset, the different outputs of a model or the origin of a dataset can be analyzed.

The MetaViz application has been developed in the project GLUES. GLUES (Global Assessment of Land Use Dynamics, Greenhouse Gas Emissions and Ecosystem Services) is a coordination project of the international research program 'Sustainable Land Management' of the German Ministry of Education and Research (BMBF). Within this funding measure twelve so called regional collaborative projects (RPs) are researching the impacts of climate and socio-economic changes and a corresponding optimization of the use of land and natural resources in different countries and regions. For an effective synthesis of research results the underlying base scenarios and the data sets must be disseminated and shared between the involved research institutions. Within the framework of GLUES the Professorship of Geoinformation Systems of the Technical University Dresden is implementing a Geodata Infrastructure (GDI) to facilitate this interdisciplinary data exchange between the scientists of GLUES and the RPs.

Information about the project GLUES: http://modul-a.nachhaltiges-landmanagement.de/en/modul-a/
Information about the Geoportal GLUES and developed applications: http://sustainable-landmanagement.net/glues-geoportal/
Information about the MetaViz application: http://sustainable-landmanagement.net/glues-geoportal/use/applications.html


# General Features of GeoNetwork

* Immediate search access to local and distributed geospatial catalogues
* Up- and downloading of data, graphics, documents, pdf files and any other content type
* An interactive Web Map Viewer to combine Web Map Services from distributed servers around the world
* Online editing of metadata with a powerful template system
* Scheduled harvesting and synchronization of metadata between distributed catalogs
* Support for OGC-CSW 2.0.2 ISO Profile, OAI-PMH, Z39.50 protocols
* Fine-grained access control with group and user management
* Multi-lingual user interface

# Documentation of GeoNetwork

User documentation is in the docs submodule in the current repository and is compiled into html pages during a release for publishing on
a website.

Developer documentation is also in the docs submodule but is being migrated out of that project into the Readme files in each module
in the project.  General documentation for the project as a whole is in this Readme and module specific documentation can be found in
each module (assuming there is module specific documentation required).

# Software Development

Instructions for setting up a development environment/building Geonetwork/compiling user documentation/making a release see:
[Software Development Documentation](/software_development/)

# Testing

With regards to testing Geonetwork is a standard Java project and primarily depends on JUnit for testing.  However there is a very important
issue to consider when writing JUnit tests in Geonetwork and that is the separation between unit tests and integration tests

* *Unit Tests* - In Geonetwork unit tests should be very very quick to execute and not start up any subsystems of the application in order to keep
    the execution time of the unit tests very short.  Integration tests do not require super classes and any assistance methods can be static
    imports, for example statically importing org.junit.Assert or org.junit.Assume or org.fao.geonet.Assert.
* *Integration Tests* - Integration Test typically start much or all of Geonetwork as part of the test and will take longer to run than
    a unit test.  However, even though the tests take longer they should still be implemented in such a way to be as efficient as possible.
    Starting Geonetwork in a way that isolates each integration test from each other integration test is non-trivial.  Because of this
    there are `abstract` super classes to assist with this.  Many modules have module specific Abstract classes.  For example at the time
    that this is being written `domain`, `core`, `harvesters` and `services` modules all have module specific super classes that need to
    be used.  (`harvesting` has 2 superclasses depending on what is to be tested.)
    The easiest way to learn how to implement an integration test is to search for other integration tests in the same module as the class
    you want to test.  The following list provides a few tips:
    * *IMPORTANT*: All Integrations tests *must* end in IntegrationTest.  The build system assumes all tests ending in IntegrationTest is
        an integration test and runs them in a build phase after unit tests.  All other tests are assumed to be unit tests.
    * Prefer unit tests over Integration Tests because they are faster.
    * Search the current module for IntegrationTest to find tests to model your integration test against
    * This you might want integration tests for are:
        * Services: If the service already exists and you quick need to write a test to debug/fix its behaviour.
                    If you are writing a new service it is better to use Mockito to mock the dependencies of the service so the test is
                    a unit test.
        * Harvesters
        * A behaviour that crosses much of the full system

*org.fao.geonet.utils.GeonetHttpRequestFactory*: When making Http requests you should use org.fao.geonet.utils.GeonetHttpRequestFactory instead
    of directly using HttpClient.  This is because there are mock instances of org.fao.geonet.utils.GeonetHttpRequestFactory that can
    be used to mock responses when performing tests.
